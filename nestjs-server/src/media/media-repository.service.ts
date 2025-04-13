import {Injectable, Logger} from "@nestjs/common";
import {MediaRepositoryInterface} from "./media-repository.interface";
import {ConfigService} from "@nestjs/config";
import {LocalMediaRepository} from "./local-media-repository";
import {S3MediaRepository} from "./s3-media-repository";



@Injectable()
export class MediaRepositoryService {
    private readonly logger = new Logger(MediaRepositoryService.name);

    mediaRepository: MediaRepositoryInterface;

    constructor(
        protected configService: ConfigService,
        protected local: LocalMediaRepository,
        protected s3: S3MediaRepository,
    ) {
        // TODO: make this configurable
        this.mediaRepository = local;
    }

    async downloadFile(filePath: string): Promise<Buffer> {
        return this.mediaRepository.downloadFile(filePath);
    }

    async createFile(filename: string): Promise<string> {
        return this.mediaRepository.createFile(filename);
    }

    async commitFile(filePath: string): Promise<void> {
        return this.mediaRepository.commitFile(filePath);
    }

    async deleteFile(filePath: string): Promise<void> {
        return this.mediaRepository.deleteFile(filePath);
    }

    async uploadFile(filePath: string, content: string): Promise<void> {
        return this.mediaRepository.uploadFile(filePath, content);
    }

}