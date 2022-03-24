import { Injectable } from '@nestjs/common';
import { FileRepositoryInterface } from './file-repository.interface';
import { LocalFileRepository } from './local-file-respository';
import { S3FileRepository } from './s3-file-repository';

export enum FileLocationType {
  local = 'local',
  s3 = 's3',
}

@Injectable()
export class FileRepositoryService {
  fileLocation = FileLocationType.s3;
  fileRepository: FileRepositoryInterface;

  constructor(
    protected local: LocalFileRepository,
    protected s3: S3FileRepository,
  ) {
    if (this.fileLocation === FileLocationType.local) {
      this.fileRepository = local;
    } else if (this.fileLocation === FileLocationType.s3) {
      this.fileRepository = s3;
    } else {
      throw new Error(`Unknown fileLocationType of ${this.fileLocation}`);
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
}
