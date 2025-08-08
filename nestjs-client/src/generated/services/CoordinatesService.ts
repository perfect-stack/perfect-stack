/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CoordinatesService {
    /**
     * Get the count of remaining rows that need WGS84 conversion
     * @returns any
     * @throws ApiError
     */
    public static coordinateConverterControllerGetSummary(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/coordinates',
        });
    }
    /**
     * Batch job to convert records with NZTM values and null WGS84 values
     * @returns any
     * @throws ApiError
     */
    public static coordinateConverterControllerConvert(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/coordinates',
        });
    }
}
