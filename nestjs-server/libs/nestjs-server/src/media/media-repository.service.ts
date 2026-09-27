import {Injectable, Logger} from "@nestjs/common";
import {MediaRepositoryInterface} from "./media-repository.interface";
import {ConfigService} from "@nestjs/config";
import {LocalMediaRepository} from "./local-media-repository";
import {S3MediaRepository} from "./s3-media-repository";
import {CreateFileResponse} from "./create-file-response";



@Injectable()
export class MediaRepositoryService {
    private readonly logger = new Logger(MediaRepositoryService.name);

    mediaRepository: MediaRepositoryInterface;

    constructor(
        protected configService: ConfigService,
        protected local: LocalMediaRepository,
        protected s3: S3MediaRepository,
    ) {
        const repoType = this.configService?.get('MEDIA_REPOSITORY') || 'local';
        this.mediaRepository = repoType === 's3' ? s3 : local;
    }

    async fileExists(filePath: string): Promise<boolean> {
        return this.mediaRepository.fileExists(filePath);
    }

    async locateFile(filePath: string): Promise<string> {
        return this.mediaRepository.locateFile(filePath);
    }

    async downloadFile(filePath: string): Promise<Buffer | string> {
        return this.mediaRepository.downloadFile(filePath);
    }

    async createFile(filename: string): Promise<CreateFileResponse> {
        return this.mediaRepository.createFile(filename);
    }

    async uploadFile(filePath: string, content: any): Promise<void> {
        return this.mediaRepository.uploadFile(filePath, content);
    }

    async commitFile(filePath: string): Promise<string> {
        return this.mediaRepository.commitFile(filePath);
    }

    async deleteFile(filePath: string): Promise<void> {
        return this.mediaRepository.deleteFile(filePath);
    }

}
