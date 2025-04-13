import {MediaRepositoryInterface} from "./media-repository.interface";

export class S3MediaRepository implements MediaRepositoryInterface {
    commitFile(filePath: string): Promise<void> {
        return Promise.resolve(undefined);
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