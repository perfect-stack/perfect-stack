/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MetaEntity } from '../models/MetaEntity';
import type { MetaMenu } from '../models/MetaMenu';
import type { MetaPage } from '../models/MetaPage';
import type { MetaRole } from '../models/MetaRole';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MetaService {
    /**
     * [PUBLIC] Get all Meta Entity files
     * @param pageNumber
     * @param pageSize
     * @returns any
     * @throws ApiError
     */
    public static metaEntityControllerFindAll(
        pageNumber: number,
        pageSize: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/meta/entity',
            query: {
                'pageNumber': pageNumber,
                'pageSize': pageSize,
            },
        });
    }
    /**
     * [PUBLIC] Get one Meta Entity file
     * @param metaName
     * @returns any
     * @throws ApiError
     */
    public static metaEntityControllerFindOne(
        metaName: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/meta/entity/{metaName}',
            path: {
                'metaName': metaName,
            },
        });
    }
    /**
     * Create a new Meta Entity file
     * @param metaName
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static metaEntityControllerCreate(
        metaName: string,
        requestBody: MetaEntity,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/meta/entity/{metaName}',
            path: {
                'metaName': metaName,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Update the supplied Meta Entity file
     * @param metaName
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static metaEntityControllerUpdate(
        metaName: string,
        requestBody: MetaEntity,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/meta/entity/{metaName}',
            path: {
                'metaName': metaName,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Not implemented yet.
     * @returns any
     * @throws ApiError
     */
    public static metaEntityControllerArchive(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/meta/entity/{metaName}',
        });
    }
    /**
     * Delete the attribute of the Meta Entity optionally both in the file and in the database (deletes the column)
     * @param metaName
     * @param attributeName
     * @param deleteAttribute
     * @param deleteDatabaseCol
     * @returns any
     * @throws ApiError
     */
    public static metaEntityControllerDeleteAttribute(
        metaName: string,
        attributeName: string,
        deleteAttribute: boolean,
        deleteDatabaseCol: boolean,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/meta/entity/{metaName}/{attributeName}',
            path: {
                'metaName': metaName,
                'attributeName': attributeName,
            },
            query: {
                'deleteAttribute': deleteAttribute,
                'deleteDatabaseCol': deleteDatabaseCol,
            },
        });
    }
    /**
     * Synchronize the Meta Entity files with the database. Creates new Tables and new columns in the database if needed.
     * @returns any
     * @throws ApiError
     */
    public static metaEntityControllerSync(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/meta/entity/database/sync',
        });
    }
    /**
     * [PUBLIC] Download all Meta Role files
     * @param pageNumber
     * @param pageSize
     * @returns any
     * @throws ApiError
     */
    public static metaRoleControllerFindAll(
        pageNumber: number,
        pageSize: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/meta/role',
            query: {
                'pageNumber': pageNumber,
                'pageSize': pageSize,
            },
        });
    }
    /**
     * [PUBLIC] Get one Meta Role file
     * @param metaRoleName
     * @returns any
     * @throws ApiError
     */
    public static metaRoleControllerFindOne(
        metaRoleName: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/meta/role/{metaRoleName}',
            path: {
                'metaRoleName': metaRoleName,
            },
        });
    }
    /**
     * Create a new Meta Role file
     * @param metaRoleName
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static metaRoleControllerCreate(
        metaRoleName: string,
        requestBody: MetaRole,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/meta/role/{metaRoleName}',
            path: {
                'metaRoleName': metaRoleName,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Update the supplied Meta Role file
     * @param metaRoleName
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static metaRoleControllerUpdate(
        metaRoleName: string,
        requestBody: MetaRole,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/meta/role/{metaRoleName}',
            path: {
                'metaRoleName': metaRoleName,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Permanently deletes the requested Meta Role file
     * @param metaRoleName
     * @returns any
     * @throws ApiError
     */
    public static metaRoleControllerDelete(
        metaRoleName: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/meta/role/{metaRoleName}',
            path: {
                'metaRoleName': metaRoleName,
            },
        });
    }
    /**
     * [PUBLIC] Find the Meta Menu file (there is only one of them)
     * @returns any
     * @throws ApiError
     */
    public static metaMenuControllerFindOne(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/meta/menu',
        });
    }
    /**
     * Updates the Meta Menu file supplied
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static metaMenuControllerUpdate(
        requestBody: MetaMenu,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/meta/menu',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * [PUBLIC] Get the server version number of the current release in this environment
     * @returns any
     * @throws ApiError
     */
    public static metaMenuControllerGetVersion(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/meta/menu/version',
        });
    }
    /**
     * [PUBLIC] Download all Meta Page files
     * @param pageNumber
     * @param pageSize
     * @returns any
     * @throws ApiError
     */
    public static metaPageControllerFindAll(
        pageNumber: number,
        pageSize: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/meta/page',
            query: {
                'pageNumber': pageNumber,
                'pageSize': pageSize,
            },
        });
    }
    /**
     * [PUBLIC] Gets the requested Meta Page
     * @param metaPageName
     * @returns any
     * @throws ApiError
     */
    public static metaPageControllerFindOne(
        metaPageName: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/meta/page/{metaPageName}',
            path: {
                'metaPageName': metaPageName,
            },
        });
    }
    /**
     * Create a new Meta Page file with the supplied data
     * @param metaPageName
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static metaPageControllerCreate(
        metaPageName: string,
        requestBody: MetaPage,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/meta/page/{metaPageName}',
            path: {
                'metaPageName': metaPageName,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Update the the supplied Meta Page
     * @param metaPageName
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static metaPageControllerUpdate(
        metaPageName: string,
        requestBody: MetaPage,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/meta/page/{metaPageName}',
            path: {
                'metaPageName': metaPageName,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Permanently deletes the requested Meta Page
     * @param metaPageName
     * @returns any
     * @throws ApiError
     */
    public static metaPageControllerDelete(
        metaPageName: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/meta/page/{metaPageName}',
            path: {
                'metaPageName': metaPageName,
            },
        });
    }
}
