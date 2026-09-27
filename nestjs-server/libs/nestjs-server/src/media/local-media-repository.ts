import {Injectable, Logger, Optional} from "@nestjs/common";
import {MediaRepositoryInterface} from "./media-repository.interface";
import {MediaUtils} from "./media-utils";
import {CreateFileResponse} from "./create-file-response";
import {ConfigService} from "@nestjs/config";
import * as fs from "fs";
import * as path from "path";
import {pipeline} from "node:stream/promises";

@Injectable()
export class LocalMediaRepository implements MediaRepositoryInterface {

    private readonly logger = new Logger(LocalMediaRepository.name);
    private readonly mediaDir: string;

    constructor(
        protected mediaUtils: MediaUtils,
        @Optional() protected configService?: ConfigService,
    ) {
        this.mediaDir = this.configService?.get('MEDIA_DIR') || './media';
        try {
            fs.mkdirSync(this.mediaDir, { recursive: true });
        } catch (err) {
            this.logger.error(`Failed to ensure media directory ${this.mediaDir}`, err);
        }
    }

    private getFullPath(filePath: string): string {
        const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
        return path.resolve(this.mediaDir, cleanPath);
    }

    async fileExists(filePath: string): Promise<boolean> {
        return fs.existsSync(this.getFullPath(filePath));
    }

    async locateFile(filePath: string): Promise<string> {
        const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
        const result = '/download/' + cleanPath;
        this.logger.log(`locateFile: ${filePath} -> ${result}`);
        return result;
    }

    async downloadFile(filePath: string): Promise<Buffer> {
        const actualFilePath = this.getFullPath(filePath);
        this.logger.log(`downloadFile: reading from ${actualFilePath}`);
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
        this.logger.log(`createFile: filename=${filename}, resourceKey=${resourceKey}, resourceUrl=${resourceUrl}`);
        return { resourceKey, resourceUrl };
    }

    async uploadFile(filePath: string, content: any): Promise<void> {
        const actualFilePath = this.getFullPath(filePath);
        fs.mkdirSync(path.dirname(actualFilePath), { recursive: true });
        this.logger.log(`uploadFile: writing to ${actualFilePath}`);

        if (content && Buffer.isBuffer(content.body)) {
            fs.writeFileSync(actualFilePath, content.body);
        } else if (Buffer.isBuffer(content)) {
            fs.writeFileSync(actualFilePath, content);
        } else if (typeof content === 'string') {
            fs.writeFileSync(actualFilePath, content);
        } else if (content && typeof content.pipe === 'function') {
            const writeStream = fs.createWriteStream(actualFilePath);
            await pipeline(content, writeStream);
        } else {
            throw new Error(`Unsupported content type for uploadFile`);
        }

        const stats = fs.statSync(actualFilePath);
        this.logger.log(`uploadFile: wrote ${stats.size} bytes to ${actualFilePath}`);
    }

    async commitFile(filePath: string): Promise<string> {
        const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
        this.logger.log(`commitFile: cleanPath=${cleanPath}`);
        // check filePath is a temp path
        if(cleanPath.startsWith('Temp/')) {
            const actualFilePath = this.getFullPath(cleanPath);
            if (fs.existsSync(actualFilePath)) {
                // calculate final path from temp path
                const mediaPath = this.mediaUtils.convertTempPathToMediaPath(cleanPath);
                const destinationFilePath = this.getFullPath(mediaPath);

                this.logger.log(`commitFile: copying from ${actualFilePath} to ${destinationFilePath}`);
                // ensure target directory exists
                fs.mkdirSync(path.dirname(destinationFilePath), { recursive: true });

                // copy file from temp to destination (but don't delete)
                fs.copyFileSync(actualFilePath, destinationFilePath);
                this.logger.log(`commitFile: copied successfully, permanent mediaPath=${mediaPath}`);
                return mediaPath;
            }
            else {
                this.logger.error(`File ${actualFilePath} does not exist`);
            }
        }
        else {
            this.logger.error(`File ${filePath} does not start with Temp/`);
        }
    }

    async deleteFile(filePath: string): Promise<void> {
        const actualFilePath = this.getFullPath(filePath);
        this.logger.log(`deleteFile: removing ${actualFilePath}`);
        if(fs.existsSync(actualFilePath)) {
            fs.unlinkSync(actualFilePath);
        }
    }

}
