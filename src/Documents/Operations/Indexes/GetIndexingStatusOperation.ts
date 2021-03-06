import { IMaintenanceOperation, OperationResultType } from "../OperationAbstractions";
import { DocumentConventions } from "../../Conventions/DocumentConventions";
import { RavenCommand } from "../../../Http/RavenCommand";
import { HttpRequestBase } from "../../../Primitives/Http";
import { ServerNode } from "../../../Http/ServerNode";
import { IndexingStatus } from "../../Indexes/IndexingStatus";

export class GetIndexingStatusOperation implements IMaintenanceOperation<IndexingStatus> {

    public get resultType(): OperationResultType {
        return "CommandResult";
    }

    public getCommand(conventions: DocumentConventions): RavenCommand<IndexingStatus> {
        return new GetIndexingStatusCommand();
    }

}

export class GetIndexingStatusCommand extends RavenCommand<IndexingStatus> {

    public createRequest(node: ServerNode): HttpRequestBase {
        const uri = node.url + "/databases/" + node.database + "/indexes/status";
        return { uri };
    }

    public setResponse(response: string, fromCache: boolean): void {
        if (!response) {
            this._throwInvalidResponse();
        }

        this.result = this._serializer.deserialize(response);
    }

    public get isReadRequest(): boolean {
        return true;
    }
}
