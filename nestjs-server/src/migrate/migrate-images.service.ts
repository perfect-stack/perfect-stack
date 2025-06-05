import {Injectable} from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import {QueryService} from "../data/query.service";
import {AttributeType, ComparisonOperator} from "../domain/meta.entity";
import {MediaRepositoryService} from "../media/media-repository.service";
import {DataService} from "../data/data.service";

interface BadFile {
    dirPath: string,
    fileName: string,
    reason: string
}

@Injectable()
export class MigrateImagesService {

    IMAGE_FOLDERS = [
        "/Users/richardperfect/dev/perfect-consulting/Kea Images/Kerry"
    ]

    birdCount = 0;
    goodImageCount = 0;
    badFileCount = 0;

    badFiles: BadFile[] = [];

    constructor(protected readonly mediaRepositoryService: MediaRepositoryService,
                protected readonly dataService: DataService,
                protected readonly queryService: QueryService) {}

    async migrateImages() {
        console.log('Migrate Images')

        // for each folder from IMAGE_FOLDERS
        for (const dirPath of this.IMAGE_FOLDERS) {
            await this.processDir(dirPath);
        }

        console.log('BirdCount: ' + this.birdCount);
        console.log('GoodImageCount: ' + this.goodImageCount);
        console.log('BadFileCount: ' + this.badFileCount);

        for(const badFile of this.badFiles) {
            console.log('BadFile: ' + badFile.dirPath + ' ' + badFile.fileName + ' ' + badFile.reason);
        }

        return;
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

        // Add media file to bird entity
        birdEntity['media_files'].push({
            id: null,
            path: '',
            mime_type: '',
            comments: null
        });

        // save the Bird
        const saveResponse = await this.dataService.save('Bird', birdEntity);
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