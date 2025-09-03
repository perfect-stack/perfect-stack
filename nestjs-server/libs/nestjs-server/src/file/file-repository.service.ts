import { Injectable, Logger } from '@nestjs/common';
import { FileRepositoryInterface } from './file-repository.interface';
import { LocalFileRepository } from './local-file-respository';
import { S3FileRepository } from './s3-file-repository';
import { ConfigService } from '@nestjs/config';

export enum FileLocationType {
  local = 'local',
  s3 = 's3',
}

@Injectable()
export class FileRepositoryService {
  private readonly logger = new Logger(FileRepositoryService.name);

  fileRepository: FileRepositoryInterface;

  constructor(
    protected configService: ConfigService,
    protected local: LocalFileRepository,
    protected s3: S3FileRepository,
  ) {
    const sourceLocation = configService.get('META_SOURCE_LOCATION', 's3');
    if (sourceLocation === FileLocationType.local) {
      this.fileRepository = local;
    } else if (sourceLocation === FileLocationType.s3) {
      this.fileRepository = s3;
    } else {
      throw new Error(`Unknown fileLocationType of ${sourceLocation}`);
    }

    this.logger.log(`sourceLocation = ${sourceLocation}`);
  }

  async listFiles(dir: string): Promise<string[]> {
    return this.fileRepository.listFiles(dir);
  }

  async readFile(filename: string): Promise<string> {
    return this.fileRepository.readFile(filename);
  }

  async writeFile(filename: string, content: string): Promise<void> {
    return this.fileRepository.writeFile(filename, content);
  }

  async deleteFile(filename: string): Promise<void> {
    return this.fileRepository.deleteFile(filename);
  }
}
