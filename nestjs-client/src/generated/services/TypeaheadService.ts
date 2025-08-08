/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TypeaheadRequest } from '../models/TypeaheadRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TypeaheadService {
    /**
     * Perform a search of the database to find rows matching the supplied search criteria. Used for Typeahead fields within the application
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static typeaheadControllerSearch(
        requestBody: TypeaheadRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/typeahead',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
