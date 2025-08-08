/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class JobService {
    /**
     * Poll for the supplied Job current status
     * @param jobId
     * @returns any
     * @throws ApiError
     */
    public static jobControllerPollJobStatus(
        jobId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/job/{jobId}',
            path: {
                'jobId': jobId,
            },
        });
    }
}
