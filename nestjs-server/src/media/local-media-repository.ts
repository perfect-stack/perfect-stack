import {MediaRepositoryInterface} from "./media-repository.interface";
import {MediaUtils} from "./media-utils";

import {Injectable, Logger} from "@nestjs/common";
import * as Buffer from "node:buffer";
import * as fs from "node:fs";
import {CreateFileResponse} from "./create-file-response";


@Injectable()
export class LocalMediaRepository implements MediaRepositoryInterface {

    private readonly logger = new Logger(LocalMediaRepository.name);
    private readonly mediaDir = './media';


    constructor(protected mediaUtils: MediaUtils) {}

    async fileExists(filePath: string): Promise<boolean> {
        if(!filePath.startsWith('/')) {
            filePath = '/' + filePath;
        }
        const actualFilePath = this.mediaDir + filePath;
        return fs.existsSync(actualFilePath);
    }

    async locateFile(filePath: string): Promise<string> {
        return '/' + filePath;
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

    async createFile(filename: string): Promise<CreateFileResponse> {
        const resourceKey = this.mediaUtils.createTempFile(filename);
        const resourceUrl = '/media/upload/' + resourceKey;
        return { resourceKey, resourceUrl };
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
                const mediaPath = this.mediaUtils.convertTempPathToMediaPath(filePath);

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

}