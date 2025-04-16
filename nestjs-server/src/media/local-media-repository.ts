import {MediaRepositoryInterface} from "./media-repository.interface";
import {MEDIA_TYPE_MAP, MediaType} from "./media-type";
import {v4 as uuid} from 'uuid';

import * as fs from 'fs';
import {Logger} from "@nestjs/common";


export class LocalMediaRepository implements MediaRepositoryInterface {

    private readonly logger = new Logger(LocalMediaRepository.name);
    private readonly mediaDir = './media';

    async fileExists(filePath: string): Promise<boolean> {
        if(!filePath.startsWith('/')) {
            filePath = '/' + filePath;
        }
        const actualFilePath = this.mediaDir + filePath;
        return fs.existsSync(actualFilePath);
    }

    async locateFile(filePath: string): Promise<string> {
        return;
    }

    async downloadFile(filePath: string): Promise<Buffer> {
        if(!filePath.startsWith('/')) {
            filePath = '/' + filePath;
        }

        const actualFilePath = this.mediaDir + filePath;
        if (fs.existsSync(actualFilePath)) {
            return fs.readFileSync(actualFilePath);
        }
        else {
            throw new Error(`Unable to read file ${actualFilePath}`);
        }
    }

    async createFile(filename: string): Promise<string> {
        const suffix = this.toSuffix(filename);
        const mediaType = this.toMediaType(suffix);
        const fileId = uuid();
        return `/media/upload/Temp/${mediaType}/${fileId}.${suffix}`;
    }

    async uploadFile(filePath: string, content: string): Promise<void> {
        fs.writeFileSync(this.mediaDir + filePath, content);
    }

    async commitFile(filePath: string): Promise<string> {
        // check filePath is a temp path
        if(filePath.startsWith('/Temp/')) {
            // check file at filePath exists
            const actualFilePath = this.mediaDir + filePath;
            if (fs.existsSync(actualFilePath)) {
                // calculate final path from temp path
                const mediaPath = this.convertTempPathToMediaPath(filePath);

                // copy file from temp to destination (but don't delete)
                fs.copyFileSync(actualFilePath, this.mediaDir + mediaPath);
                return mediaPath;
            }
            else {
                this.logger.error(`File ${actualFilePath} does not exist`);
            }
        }
        else {
            this.logger.error(`File ${filePath} does not start with /Temp/`)
        }
    }

    async deleteFile(filePath: string): Promise<void> {
        const actualFilePath = this.mediaDir + filePath;
        if (fs.existsSync(actualFilePath)) {
            fs.unlinkSync(actualFilePath);
        }
        else {
            this.logger.warn(`Attempt to delete a file but it does not exist: ${actualFilePath}`);
        }

    }

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

    private convertTempPathToMediaPath(tempPath: string) {
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