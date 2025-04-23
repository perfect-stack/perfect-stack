import {CreateFileResponse} from "./create-file-response";

export interface MediaRepositoryInterface {
    fileExists(filePath: string): Promise<boolean>;
    locateFile(filePath: string): Promise<string>;    // convert the logical database filePath into a URL for download (might be API or S3)
    downloadFile(filePath: string): Promise<Buffer>;  // download file bytes through the API. Presigned URLs go direct.

    createFile(filename: string): Promise<CreateFileResponse>;    // convert raw filename to a Temp location of mediaType and a unique id (path = /Temp/mediaType/uniqueId.suffix), returns URL for the file (which can be API or S3)
    uploadFile(filePath: string, content: string): Promise<void>;  // uploads to a temporary location (only needed for API uploads, pre-signed will go to S3)
    commitFile(filePath: string): Promise<string>;    // moves from temporary location to permanent location (editing flows could mean it's discarded)

    deleteFile(filePath: string): Promise<void>;

}
