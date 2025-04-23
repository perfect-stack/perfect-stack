import {MediaRepositoryInterface} from "./media-repository.interface";
import {
    CopyObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    HeadObjectCommand,
    PutObjectCommand,
    S3Client
} from "@aws-sdk/client-s3";
import {Injectable, Logger} from "@nestjs/common";
import {MediaUtils} from "./media-utils";

import * as Buffer from "node:buffer";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {CreateFileResponse} from "./create-file-response";

@Injectable()
export class S3MediaRepository implements MediaRepositoryInterface {

    private readonly logger = new Logger(S3MediaRepository.name);

    readonly BUCKET_NAME = "dev2-kims-media";
    readonly client = new S3Client({});


    constructor(protected mediaUtils: MediaUtils) {
    }

    fileExists(filePath: string): Promise<boolean> {
        return Promise.resolve(false);
    }

    locateFile(filePath: string): Promise<string> {
        // TODO: should we validate that the file exists using S3 directly first?
        this.logger.log(`locateFile: ${filePath}`);
        const resourceKey = filePath;

        const client = new S3Client({ region: "ap-southeast-2" });
        const command = new GetObjectCommand({ Bucket: this.BUCKET_NAME, Key: resourceKey });
        return getSignedUrl(client, command, { expiresIn: 3600 });
    }

    downloadFile(filePath: string): Promise<Buffer> {
        throw new Error("Unexpected method call. This method is deliberately not implemented since caller should have presigned URL");
    }

    async createFile(filename: string): Promise<CreateFileResponse> {
        const contentType = this.mediaUtils.toContentType(filename);
        const resourceKey = this.mediaUtils.createTempFile(filename);
        const client = new S3Client({ region: "ap-southeast-2" });
        const command = new PutObjectCommand({
            Bucket: this.BUCKET_NAME,
            Key: resourceKey,
            ContentType: contentType
        });
        const resourceUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
        return { resourceKey, resourceUrl };
    }

    uploadFile(filePath: string, content: string): Promise<void> {
        throw new Error("Unexpected method call. This method is deliberately not implemented since caller should have presigned URL");
    }

    async commitFile(filePath: string): Promise<string> {
        // check filePath is a temp path
        console.log(`commitFile: ${filePath}`);
        if(filePath.startsWith('Temp/')) {
            // TODO: check file at filePath exists
            const tempKey = filePath;
            const finalKey = this.mediaUtils.convertTempPathToMediaPath(filePath); // e.g., Image/uuid.png

            try {
                // 2. Check if the temporary object exists using HeadObject
                // This will throw an error (usually 'NotFound') if the object doesn't exist
                const headCmd = new HeadObjectCommand({
                    Bucket: this.BUCKET_NAME,
                    Key: tempKey,
                });
                await this.client.send(headCmd);
                this.logger.debug(`Temporary object found: ${tempKey}`);

                // 3. Copy the object from the temporary location to the final location
                const copyCmd = new CopyObjectCommand({
                    Bucket: this.BUCKET_NAME,
                    CopySource: `${this.BUCKET_NAME}/${tempKey}`, // Must include bucket name in CopySource
                    Key: finalKey, // Destination key
                    // Optional: Add metadata directives, ACLs, etc. if needed
                    // MetadataDirective: "COPY", // Copies metadata from source
                });
                await this.client.send(copyCmd);
                this.logger.log(`Successfully copied S3 object from ${tempKey} to ${finalKey}`);

                // 4. IMPORTANT: Delete the temporary object after successful copy
                const deleteCmd = new DeleteObjectCommand({
                    Bucket: this.BUCKET_NAME,
                    Key: tempKey,
                });
                await this.client.send(deleteCmd);
                this.logger.log(`Successfully deleted temporary S3 object: ${tempKey}`);

                // 5. Return the final key (path)
                return finalKey;

            } catch (error) {
                // Check if the error is specifically because the temporary file wasn't found
                // The error name for "Not Found" in SDK v3 is typically 'NotFound'
                if (error.name === 'NotFound') {
                    this.logger.error(`Commit failed: Temporary S3 object "${tempKey}" does not exist.`);
                    return null; // Indicate failure due to missing temp file
                } else {
                    // Log any other unexpected errors during head, copy, or delete
                    this.logger.error(`Error committing S3 file from ${tempKey} to ${finalKey}:`, error);
                    // Re-throw the error to be handled upstream
                    throw new Error(`Failed to commit file: ${error.message || 'Unknown S3 error'}`);
                }
            }
        }
        else {
            this.logger.error(`File ${filePath} does not start with Temp/`)
        }
    }

    async deleteFile(filePath: string): Promise<void> {
        // filePath here is the S3 object key
        this.logger.warn(`Attempting to delete S3 object: ${filePath}`);

        const deleteCmd = new DeleteObjectCommand({
            Bucket: this.BUCKET_NAME,
            Key: filePath,
        });

        try {
            // Send the command using the class's S3 client instance
            await this.client.send(deleteCmd);
            this.logger.warn(`Successfully deleted S3 object: ${filePath}`);
        } catch (error) {
            // It is acceptable if the file is already gone.
            // Check for the specific error name (usually 'NotFound' or 'NoSuchKey' depending on context/version)
            // For SDK v3, 'NotFound' is common for HeadObject, but DeleteObject might not error if the key doesn't exist,
            // or it might throw a different error. Let's log a warning but not fail hard if it's likely a "not found" scenario.
            // A more robust check might involve a HeadObject first, but that adds latency/cost.
            if (error.name === 'NoSuchKey' || error.name === 'NotFound') { // Check common names for "not found"
                this.logger.warn(`Attempted to delete S3 object, but it does not exist (or was already deleted): ${filePath}`);
                // Resolve successfully as the desired state (object doesn't exist) is achieved.
                return;
            } else {
                // Log and re-throw other unexpected errors
                this.logger.error(`Error deleting S3 object ${filePath}:`, error);
                throw new Error(`Unable to delete file ${filePath}: ${error.message || 'Unknown S3 error'}`);
            }
        }
    }
}