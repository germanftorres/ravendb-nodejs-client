import {User} from "../Assets/Entities";
import * as assert from "assert";
import { testContext, disposeTestDocumentStore } from "../Utils/TestUtil";

import {
    IDocumentStore,
    HiloIdGenerator,
    HiloMultiDatabaseIdGenerator,
    DocumentStore,
} from "../../src";
import { ArrayUtil } from "../../src/Utility/ArrayUtil";

describe("HiLo", function () {

    class HiloDoc {
        // tslint:disable-next-line:variable-name
        public Max: number;
    }

    class Product {
        public productName: string;
    }

    let store: IDocumentStore;

    beforeEach(async function () {
        store = await testContext.getDocumentStore();
    });

    afterEach(async () => 
        await disposeTestDocumentStore(store));

    it("does not get another range, when doing parallel requests", async () => {
        const users = ArrayUtil.range(32, i => Object.assign(new User(), { name: "user" + i }));
        const storeOps = users.map(x => { 
            const session = store.openSession();
            return session.store(x)
                .then(() => session.saveChanges());
        });
        await Promise.all(storeOps);

        const userIds = users.map(x => x.id);
        assert.equal(new Set(userIds).size, userIds.length, `Ids are not unique: ${userIds}`);

        userIds
            .map(id => id.split("/")[1])
            .forEach(numericPart => {
                assert.ok(parseInt(numericPart, 10) < 33, 
                    "Obtained ids should be less than 33, though they are:" + users.map(x => x.id).toString());
            });

    });

    it("picks up where it left off", async () => {
        const store1 = await testContext.getDocumentStore("hilo_continues");
        try {
            const users = ArrayUtil.range(10, i => Object.assign(new User(), { name: "user" + i }));
            const storeOps = users.map(x => {
                const session = store1.openSession();
                return session.store(x)
                    .then(() => session.saveChanges());
            });
            await Promise.all(storeOps);
            await store1["_multiDbHiLo"].returnUnusedRange();

            const store2 = await testContext.getDocumentStore();
            try {
                const session = store2.openSession(store1.database);
                const newUser = Object.assign(new User(), { name: "new" });
                await session.store(newUser);
                await session.saveChanges();
                assert.equal(newUser.id, "users/11-A");
            } finally {
                store2.dispose();
            }
        } finally {
            store1.dispose();
        }

    });

    it("cannot go down", async () => {
        const session = store.openSession();
        const hiloDoc: HiloDoc = Object.assign(new HiloDoc(), { Max: 32 });

        await session.store(hiloDoc, "Raven/Hilo/users");
        await session.saveChanges();

        const hiLoKeyGenerator = new HiloIdGenerator(store, store.database, "users");
        const ids = [];
        const firstNextId = await hiLoKeyGenerator.nextId();
        ids.push(firstNextId);

        hiloDoc.Max = 12;
        await session.store(hiloDoc, "Raven/Hilo/users", {
            changeVector: null
        });
        await session.saveChanges();
        for (let i = 0; i < 128; i++) {
            const nextId = await hiLoKeyGenerator.nextId();
            assert.ok(!ids.includes(nextId));
            ids.push(nextId);
        }

        assert.equal(new Set(ids).size, ids.length);

    });

    it("can operate with multiple DBs", async () => {
        const session = store.openSession();
        const hiloDoc: HiloDoc = Object.assign(new HiloDoc(), { Max: 64 });

        await session.store(hiloDoc, "Raven/Hilo/users");

        const productsHilo = Object.assign(new HiloDoc(), { Max: 128 });
        await session.store(productsHilo, "Raven/Hilo/products");

        await session.saveChanges();

        const multiDbHilo = new HiloMultiDatabaseIdGenerator(store);
        let generatedDocumentKey = await multiDbHilo.generateDocumentId(null, new User());
        assert.equal(generatedDocumentKey, "users/65-A");

        generatedDocumentKey = await multiDbHilo.generateDocumentId(null, new Product());
        assert.equal(generatedDocumentKey, "products/129-A");
    });

    it("capacity should double", async () => {
            const hiLoIdGenerator = new HiloIdGenerator(store, store.database, "users");

            {
                const session = store.openSession();
                const hiloDoc: HiloDoc = Object.assign(new HiloDoc(), { Max: 64 });
                await session.store(hiloDoc, "Raven/Hilo/users");
                await session.saveChanges();

                for (let i = 0; i < 32; i++) {
                    await hiLoIdGenerator.generateDocumentId(new User());
                }
            }

            {
                const session = store.openSession();
                const hiloDoc = await session.load<HiloDoc>("Raven/Hilo/users");
                assert.equal(hiloDoc.Max, 96);
                assert.equal(hiloDoc.constructor, HiloDoc); // should take type from @metadata

                await hiLoIdGenerator.generateDocumentId(new User());
            }

            {
                const session = store.openSession();
                const hiloDoc = await session.load<HiloDoc>("Raven/Hilo/users");
                assert.equal(hiloDoc.Max, 160);
                assert.equal(hiloDoc.constructor, HiloDoc);
            }
    });

    it("returns unused range on dispose", async () => {

        let newStore = new DocumentStore(store.urls, store.database);
        newStore.initialize();

        {
            const session = newStore.openSession();
            const hiloDoc: HiloDoc = Object.assign(new HiloDoc(), { Max: 32 });
            await session.store(hiloDoc, "Raven/Hilo/users");
            await session.saveChanges();

            await session.store(new User());
            await session.store(new User());
            await session.saveChanges();
        }

        async function waitForStoreDisposeFinish() {
            return new Promise((resolve) => 
                newStore.once("afterDispose", () => resolve()));
        }

        newStore.dispose(); // on document store dispose(), hilo-return should be called

        await waitForStoreDisposeFinish();
        
        newStore = new DocumentStore(store.urls, store.database);
        newStore.initialize();

        {
            const session = newStore.openSession();
            const hiloDoc = await session.load<HiloDoc>("Raven/Hilo/users", HiloDoc);
            assert.equal(hiloDoc.Max, 34);
            assert.equal(hiloDoc.constructor, HiloDoc); // should take type from @metadata
        }

        newStore.dispose();
    });
});
