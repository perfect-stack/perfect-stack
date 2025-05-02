import {Injectable} from "@nestjs/common";
import {MEDIA_TYPE_MAP, MediaType} from "./media-type";

import {v4 as uuid} from 'uuid';
import * as mime from 'mime-types';


@Injectable()
export class MediaUtils {

    private toSuffix(filename: string): string {
        if(filename.indexOf('.') > -1) {
            const parts = filename.split('.');
            return parts[parts.length - 1];
        }
        else {
            throw new Error('filename does not contain a suffix')
        }
    }

    private toMediaType(suffix: string): MediaType {
        if(MEDIA_TYPE_MAP.has(suffix)) {
            return MEDIA_TYPE_MAP.get(suffix);
        }
        else {
            throw new Error(`Unsupported media type: ${suffix}`);
        }
    }

    public toContentType(filename: string): string {
        const suffix = this.toSuffix(filename);
        const mediaType = this.toMediaType(suffix);
        if(mediaType) {
            const contentType = mime.lookup(filename);
            if(contentType) {
                return contentType;
            }
            else {
                throw new Error(`Unsupported content-type: ${filename}`);
            }
        }
    }

    public createTempFile(filename: string) {
        const suffix = this.toSuffix(filename);
        const mediaType = this.toMediaType(suffix);
        const fileId = uuid();
        // This method should not have the leading / otherwise S3 will treat it as a directory name
        return `Temp/${mediaType}/${fileId}.${suffix}`;
    }

    public convertTempPathToMediaPath(tempPath: string) {
        if(tempPath.startsWith('Temp/')) {
            // subtract 'Temp/' from the start of tempPath
            const pathWithoutTemp = tempPath.substring('Temp/'.length);
            return `${pathWithoutTemp}`;
        }
        else {
            throw new Error('tempPath does not start with Temp/');
        }
    }

}