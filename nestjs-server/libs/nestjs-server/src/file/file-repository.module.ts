import { Module } from '@nestjs/common';
import { FileRepositoryService } from './file-repository.service';
import { LocalFileRepository } from './local-file-respository';
import { S3FileRepository } from './s3-file-repository';

@Module({
  providers: [FileRepositoryService, LocalFileRepository, S3FileRepository],
  exports: [FileRepositoryService],
})
export class FileRepositoryModule {}
