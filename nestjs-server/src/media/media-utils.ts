import {Injectable} from "@nestjs/common";
import {MEDIA_TYPE_MAP, MediaType} from "./media-type";

import {v4 as uuid} from 'uuid';


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

    public createTempFile(filename: string) {
        const suffix = this.toSuffix(filename);
        const mediaType = this.toMediaType(suffix);
        const fileId = uuid();
        return `/Temp/${mediaType}/${fileId}.${suffix}`;
    }

    public convertTempPathToMediaPath(tempPath: string) {
        if(tempPath.startsWith('/Temp/')) {
            // subtract '/Temp/' from the start of tempPath
            const pathWithoutTemp = tempPath.substring('/Temp/'.length);
            return `/${pathWithoutTemp}`;
        }
        else {
            throw new Error('tempPath does not start with /Temp/');
        }
    }

}