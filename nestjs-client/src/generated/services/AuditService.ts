/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuditService {
    /**
     * Find all audit records for the supplied entity id
     * @param id
     * @returns any
     * @throws ApiError
     */
    public static auditControllerFindAll(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/audit/{id}',
            path: {
                'id': id,
            },
        });
    }
}
