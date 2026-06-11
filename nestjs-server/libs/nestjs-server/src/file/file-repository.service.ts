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
    const sourceLocationStrategy = configService.get('META_SOURCE_LOCATION', 's3');
    if (sourceLocationStrategy === FileLocationType.local) {
      this.fileRepository = local;
    } else if (sourceLocationStrategy === FileLocationType.s3) {
      this.fileRepository = s3;
    } else {
      throw new Error(`Unknown fileLocationType of ${sourceLocationStrategy}`);
    }

    this.logger.log(`sourceLocationStrategy = ${sourceLocationStrategy}`);

    const sourceLocationDir = configService.get('META_SOURCE_LOCATION_DIR');
    if(sourceLocationDir) {
      this.logger.log(`sourceLocationDir = ${sourceLocationDir}`);
      this.fileRepository.setBaseDir(sourceLocationDir);
    }
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
