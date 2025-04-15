import {MediaRepositoryInterface} from "./media-repository.interface";
import * as Buffer from "node:buffer";

export class S3MediaRepository implements MediaRepositoryInterface {
    commitFile(filePath: string): Promise<string> {
        return Promise.resolve(undefined);
    }

    fileExists(filePath: string): Promise<boolean> {
        return Promise.resolve(false);
    }

    createFile(filename: string): Promise<string> {
        return Promise.resolve("");
    }

    deleteFile(filePath: string): Promise<void> {
        return Promise.resolve(undefined);
    }

    downloadFile(filePath: string): Promise<Buffer> {
        return Promise.resolve(undefined);
    }

    uploadFile(filePath: string, content: string): Promise<void> {
        return Promise.resolve(undefined);
    }

}