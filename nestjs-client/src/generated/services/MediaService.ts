/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MediaService {
    /**
     * @param filePath
     * @returns any
     * @throws ApiError
     */
    public static mediaControllerLocateFile(
        filePath: Array<string>,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/media/locate/{filePath}',
            path: {
                'filePath': filePath,
            },
        });
    }
    /**
     * @param filePath
     * @returns any
     * @throws ApiError
     */
    public static mediaControllerDownloadFile(
        filePath: Array<string>,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/media/download/{filePath}',
            path: {
                'filePath': filePath,
            },
        });
    }
    /**
     * @param filename
     * @returns any
     * @throws ApiError
     */
    public static mediaControllerCreateFile(
        filename: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/media/create/{filename}',
            path: {
                'filename': filename,
            },
        });
    }
    /**
     * @param formData
     * @returns any
     * @throws ApiError
     */
    public static mediaControllerUploadFile(
        formData: {
            file?: Blob;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/media/upload',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * @returns any
     * @throws ApiError
     */
    public static mediaControllerCommitFile(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/media/{filePath}',
        });
    }
    /**
     * @returns any
     * @throws ApiError
     */
    public static mediaControllerDeleteFile(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/media/{filePath}',
        });
    }
}
