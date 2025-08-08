/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MigrateService {
    /**
     * @returns any
     * @throws ApiError
     */
    public static migrateControllerMigrateData(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/migrate/data',
        });
    }
    /**
     * @returns any
     * @throws ApiError
     */
    public static migrateControllerMigrateImages(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/migrate/images',
        });
    }
}
