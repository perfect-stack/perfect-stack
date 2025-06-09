import {Injectable} from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import {QueryService} from "../data/query.service";
import {AttributeType, ComparisonOperator} from "../domain/meta.entity";
import {MediaRepositoryService} from "../media/media-repository.service";
import {DataService} from "../data/data.service";
import {MediaUtils} from "../media/media-utils";
import {ConfigService} from "@nestjs/config";
import {
    CopyObjectCommand,
    DeleteObjectCommand, DeleteObjectsCommand,
    GetObjectCommand,
    HeadObjectCommand, ListObjectsV2Command, ObjectIdentifier,
    PutObjectCommand,
    S3Client
} from "@aws-sdk/client-s3";



interface BadFile {
    dirPath: string,
    fileName: string,
    reason: string
}

@Injectable()
export class MigrateImagesService {

    IMAGE_FOLDERS = [
        "/Users/richardperfect/dev/perfect-consulting/Kea Images/Cutdown"
    ]

    birdCount = 0;
    goodImageCount = 0;
    badFileCount = 0;

    goodFiles: Set<string> = new Set();
    badFiles: BadFile[] = [];
    readonly s3Client = new S3Client({});


    constructor(
        protected configService: ConfigService,
        protected readonly mediaRepositoryService: MediaRepositoryService,
        protected readonly mediaUtils: MediaUtils,
        protected readonly dataService: DataService,
        protected readonly queryService: QueryService) {}

    async migrateImages() {
        console.log('Migrate Images')

        // TODO: make this switchable
        await this.resetTargetDataStores();

        // for each folder from IMAGE_FOLDERS
        for (const dirPath of this.IMAGE_FOLDERS) {
            await this.processDir(dirPath);
        }

        console.log('\nBirdCount: ' + this.birdCount);
        console.log('GoodImageCount: ' + this.goodImageCount);
        console.log('BadFileCount: ' + this.badFileCount);

        console.log('\nGood Files:');
        for(const goodFile of this.goodFiles) {
            console.log(goodFile);
        }

        console.log('\nBad Files:');
        for(const badFile of this.badFiles) {
            console.log('BadFile: ' + badFile.dirPath + ' ' + badFile.fileName + ' ' + badFile.reason);
        }

        return;
    }

    private async resetTargetDataStores() {
        await this.resetTargetTable();
        await this.resetFileStore();
    }

    private async resetTargetTable() {
        // Truncate the BirdMediaFile table
        await this.dataService.truncateTable('BirdMediaFile');
    }

    private async resetFileStore() {
        const bucketName = this.configService.get('MEDIA_BUCKET_NAME');
        console.log(`Starting deletion of all objects in bucket: ${bucketName}`);

        try {
            let continuationToken: string | undefined;
            let deletedCount = 0;

            do {
                const listObjectsParams = {
                    Bucket: bucketName,
                    ContinuationToken: continuationToken,
                };

                const listObjectsResponse = await this.s3Client.send(
                    new ListObjectsV2Command(listObjectsParams)
                );

                if (!listObjectsResponse.Contents || listObjectsResponse.Contents.length === 0) {
                    if (!continuationToken) { // Only log "no objects" if it's the first pass
                        console.log(`No objects found in bucket: ${bucketName}`);
                    }
                    break; // No more objects to delete
                }

                const objectsToDelete: ObjectIdentifier[] = listObjectsResponse.Contents.map(
                    (obj) => ({
                        Key: obj.Key,
                    })
                );

                if (objectsToDelete.length > 0) {
                    const deleteObjectsParams = {
                        Bucket: bucketName,
                        Delete: {
                            Objects: objectsToDelete,
                            Quiet: false, // Set to true if you don't want a list of deleted/error objects in response
                        },
                    };

                    const deleteObjectsResponse = await this.s3Client.send(
                        new DeleteObjectsCommand(deleteObjectsParams)
                    );

                    if (deleteObjectsResponse.Deleted) {
                        deletedCount += deleteObjectsResponse.Deleted.length;
                        console.log(`Successfully deleted ${deleteObjectsResponse.Deleted.length} objects.`);
                    }

                    if (deleteObjectsResponse.Errors && deleteObjectsResponse.Errors.length > 0) {
                        console.error("Errors occurred while deleting some objects:");
                        deleteObjectsResponse.Errors.forEach((error) => {
                            console.error(`  - Key: ${error.Key}, Code: ${error.Code}, Message: ${error.Message}`);
                        });
                    }
                }

                continuationToken = listObjectsResponse.NextContinuationToken;
            } while (continuationToken);

            console.log(`Finished deletion process. Total objects deleted: ${deletedCount}`);
        } catch (error) {
            console.error(`Error deleting objects from bucket ${bucketName}:`, error);
            throw error; // Re-throw the error if you want to handle it further up the call stack
        }
    }

    private async processDir(dirPath: string) {
        console.log(`Processing dir: ${dirPath}`);
        const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                this.birdCount++;
                const fullPath = path.join(dirPath, entry.name);
                await this.processDir(fullPath);
            } else {
                await this.processFile(dirPath, entry.name);
            }
        }
    }

    private async processFile(dirPath: string, fileName: string) {
        console.log('Dir: ' + dirPath + '  File: ' + fileName);
        const bandNumber = this.toBandNumber(dirPath, fileName);
        if(bandNumber) {
            console.log('   ' + bandNumber)
            if(fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.jpeg')) {
                const birdEntity = await this.findBird(dirPath, fileName, bandNumber);
                if(birdEntity) {
                    await this.uploadFile(dirPath, fileName, birdEntity);
                }
            }
            else {
                this.addBadFile(dirPath, fileName, "NOT-JPG");
            }
        }
        else {
            this.addBadFile(dirPath, fileName, "NO-BAND");
        }
    }

    private async findBird(dirPath: string, fileName: string, bandNumber: string) {
        const queryResult = await this.queryService.findByCriteria({
            metaEntityName: 'Bird',
            criteria: [
                {
                    name: 'band_number',
                    operator: ComparisonOperator.StartsWith,
                    attributeType: AttributeType.Text,
                    value: bandNumber
                }
            ],
            orderByName: 'id',
            orderByDir: 'ASC',
            pageNumber: 1,
            pageSize: 50,
        });

        if(queryResult.totalCount === 1) {
            const birdSearchResult = queryResult.resultList[0];
            const birdEntity = await this.queryService.findOne('Bird', birdSearchResult['id']);
            if(birdEntity) {
                this.goodImageCount++;
                return birdEntity;
            }
            else {
                this.addBadFile(dirPath, fileName, "CANT-FIND-BIRD-ID");
            }
        }
        else {
            if (queryResult.totalCount === 0) {
                this.addBadFile(dirPath, fileName, "NO-BIRD");
            }
            else {
                this.addBadFile(dirPath, fileName, "MULTIPLE-BIRDS");
            }
        }
        return null;
    }

    private async uploadFile(dirPath: string, fileName: string, birdEntity: any) {

        const createFileResponse = await this.mediaRepositoryService.createFile(fileName);

        // upload file to signed url
        const mediaFilePath = createFileResponse.resourceKey;
        const presignedUrl = createFileResponse.resourceUrl;

        const fullFilePath = path.join(dirPath, fileName);
        const fileContent = fs.readFileSync(fullFilePath);
        const contentType = this.mediaUtils.toContentType(fileName);

        await fetch(presignedUrl, {
            method: 'PUT',
            body: fileContent,
            headers: {
                'Content-Type': contentType
            }
        });

        // Add media file to bird entity
        birdEntity['media_files'].push({
            id: null,
            path: mediaFilePath,
            mime_type: contentType,
            comments: null
        });

        // save the Bird
        const saveResponse = await this.dataService.save('Bird', birdEntity);
        this.goodFiles.add(birdEntity['band_number']);
    }

    private toBandNumber(dirPath: string, fileName: string) {
        const parentDir = dirPath.split('/').pop();
        if(parentDir.startsWith('V-')) {
            const tokens = parentDir.split(/\s+/);
            if(tokens.length > 0 && tokens[0].startsWith('V-')) {
                return tokens[0];
            }
        }
        return null;
    }

    private toBirdName(dirPath: string, fileName: string) {
    }

    private addBadFile(dirPath: string, fileName: string, reason: string) {
        this.badFileCount++;
        this.badFiles.push({
            dirPath, fileName, reason
        });
    }
}