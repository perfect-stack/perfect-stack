/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LoginNotification } from '../models/LoginNotification';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthenticationService {
    /**
     * Callback from the client to notify the server that a login has been successful. Used for the time of Last Sign In.
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static authenticationControllerNotification(
        requestBody: LoginNotification,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/authentication/notification',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Find the Last Sign In time of the requested username
     * @param username
     * @returns any
     * @throws ApiError
     */
    public static authenticationControllerFindLastSignIn(
        username: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/authentication/last-sign-in/{username}',
            path: {
                'username': username,
            },
        });
    }
}
