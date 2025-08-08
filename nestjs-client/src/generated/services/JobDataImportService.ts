/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DataImportModel } from '../models/DataImportModel';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class JobDataImportService {
    /**
     * @param formData
     * @returns any
     * @throws ApiError
     */
    public static dataImportJobControllerUploadFile(
        formData: {
            file?: Blob;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/job/data-import/upload',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static dataImportJobControllerImportData(
        requestBody: DataImportModel,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/job/data-import/import',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
