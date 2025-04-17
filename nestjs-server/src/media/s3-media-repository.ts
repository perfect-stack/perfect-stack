import {MediaRepositoryInterface} from "./media-repository.interface";
import * as Buffer from "node:buffer";

export class S3MediaRepository implements MediaRepositoryInterface {

    fileExists(filePath: string): Promise<boolean> {
        return Promise.resolve(false);
    }

    locateFile(filePath: string): Promise<string> {
        return Promise.resolve(undefined);
    }

    downloadFile(filePath: string): Promise<Buffer> {
        throw new Error("Unexpected method call. This method is deliberately not implemented since caller should have presigned URL");
    }

    createFile(filename: string): Promise<string> {
        return Promise.resolve("");
    }

    uploadFile(filePath: string, content: string): Promise<void> {
        throw new Error("Unexpected method call. This method is deliberately not implemented since caller should have presigned URL");
    }

    commitFile(filePath: string): Promise<string> {
        return Promise.resolve(undefined);
    }

    deleteFile(filePath: string): Promise<void> {
        return Promise.resolve(undefined);
    }

}