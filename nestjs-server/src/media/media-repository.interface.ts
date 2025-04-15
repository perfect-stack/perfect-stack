export interface MediaRepositoryInterface {
    downloadFile(filePath: string): Promise<Buffer>;   // file bytes, or presigned URL
    createFile(filename: string): Promise<string>;   // convert filename to mediaType and a unique id... mediaType, id, <path = mediaType/id.suffix>,  returns "handle" for the file
                                                     // returns the filePath e.g   "temp/image/123-3345-A34-E567.jpeg"
    uploadFile(filePath: string, content: string): Promise<void>;  // uploads to a temporary location (only needed for API uploads, pre-signed will go to S3)
    commitFile(filePath: string): Promise<string>;  // moves from temporary location to permanent location (editing flows could mean it's discarded)
    deleteFile(filePath: string): Promise<void>;

    fileExists(filePath: string): Promise<boolean>;
}
