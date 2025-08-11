/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { QueryRequest } from '../models/QueryRequest';
import type { UpdateSortIndexRequest } from '../models/UpdateSortIndexRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DataService {
    /**
     * Find all data rows for the supplied entity name
     * @param entityName
     * @param pageNumber
     * @param pageSize
     * @returns any
     * @throws ApiError
     */
    public static dataControllerFindAll(
        entityName: string,
        pageNumber: number,
        pageSize: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/data/{entityName}',
            path: {
                'entityName': entityName,
            },
            query: {
                'pageNumber': pageNumber,
                'pageSize': pageSize,
            },
        });
    }
    /**
     * Save (create/update) the supplied request body as the specified entity with the supplied id
     * @param entityName
     * @param requestBody Entity to save
     * @returns any
     * @throws ApiError
     */
    public static dataControllerSave(
        entityName: string,
        requestBody: Record<string, any>,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/data/{entityName}',
            path: {
                'entityName': entityName,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Find all data rows for the supplied query request containing entity name and other criteria
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static dataControllerFindByCriteria(
        requestBody: QueryRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/data/query',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Find one entity by entity name and id
     * @param entityName
     * @param id
     * @returns any
     * @throws ApiError
     */
    public static dataControllerFindOne(
        entityName: string,
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/data/{entityName}/{id}',
            path: {
                'entityName': entityName,
                'id': id,
            },
        });
    }
    /**
     * Permanently deletes the supplied entity with the supplied id value
     * @param entityName
     * @param id
     * @returns any
     * @throws ApiError
     */
    public static dataControllerDestroy(
        entityName: string,
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/data/{entityName}/{id}',
            path: {
                'entityName': entityName,
                'id': id,
            },
        });
    }
    /**
     * Update the sort index value for certain reference data types
     * @param entityName
     * @param id
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static dataControllerUpdateSortIndex(
        entityName: string,
        id: string,
        requestBody: UpdateSortIndexRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/data/{entityName}/{id}/sort_index',
            path: {
                'entityName': entityName,
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Check if the entity with the supplied id value can be deleted
     * @param entityName
     * @param id
     * @returns any
     * @throws ApiError
     */
    public static dataControllerDestroyCheck(
        entityName: string,
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/data/check/{entityName}/{id}',
            path: {
                'entityName': entityName,
                'id': id,
            },
        });
    }
}
