import { IDocumentQueryBaseSingle } from "./IDocumentQueryBaseSingle";
import { IEnumerableQuery } from "./IEnumerableQuery";
import { QueryResult } from "../Queries/QueryResult";
import { DocumentType } from "../DocumentAbstractions";
import { QueryData } from "../Queries/QueryData";
import { GroupBy } from "../Queries/GroupBy";
import { IDocumentQueryBase } from "./IDocumentQueryBase";
import { IGroupByDocumentQuery } from "./IGroupByDocumentQuery";

/**
 * A query against a Raven index
 */
export interface IDocumentQuery<T extends object> 
    extends IDocumentQueryBase<T, IDocumentQuery<T>>, 
            IDocumentQueryBaseSingle<T>, 
            IEnumerableQuery<T> {

    indexName;

    /**
     * Whether we should apply distinct operation to the query on the server side
     * @return true if server should return distinct results
     */
    isDistinct;

    /**
     * Returns the query result. Accessing this property for the first time will execute the query.
     * @return query result
     */
    getQueryResult(): Promise<QueryResult>;

    /**
     * Selects the specified fields directly from the index if the are stored. 
     * If the field is not stored in index, value
     * will come from document directly.
     * @param <TProjection> projection class
     * @param projectionClass projection class
     * @return Document query
     */
     selectFields<TProjection extends object>(
         property: string, projectionClass: DocumentType<TProjection>): IDocumentQuery<TProjection>;
     selectFields<TProjection extends object>(
         properties: string[], projectionClass: DocumentType<TProjection>): IDocumentQuery<TProjection>;

    /**
     * Selects the specified fields directly from the index if the are stored. 
     * If the field is not stored in index, value will come from document directly.
     * @param <TProjection> projection class
     * @param properties Fields to fetch
     * @return Document query
     */
     selectFields<TProjection extends object>(properties: string[]): IDocumentQuery<TProjection>;

     selectFields<TProjection extends Object>(property: string): IDocumentQuery<TProjection>;

    /**
     * Selects the specified fields directly from the index if the are stored. 
     * If the field is not stored in index, value will come from document directly.
     * @param <TProjection> projection class
     * @param queryData Query data to use
     * @param projectionClass projection class
     * @return Document query
     */
    selectFields<TProjection extends object>(
        queryData: QueryData, projectionClass: DocumentType<T>): IDocumentQuery<TProjection>;

    /**
     * Changes the return type of the query
     * @param <TResult> class of result
     * @param resultClass class of result
     * @return Document query
     */
    ofType<TResult extends object>(resultClass: DocumentType<TResult>): IDocumentQuery<TResult>;

    groupBy(fieldName: string, ...fieldNames: string[]): IGroupByDocumentQuery<T>;
    groupBy(field: GroupBy, ...fields: GroupBy[]): IGroupByDocumentQuery<T>;

    //TBD MoreLikeThis
    //TBD AggregateBy
    //TBD SuggestUsing

}