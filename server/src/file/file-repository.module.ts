import { Module } from '@nestjs/common';
import { LocalFileRepository } from './local-file-respository';
import { S3FileRepository } from './s3-file-repository';

@Module({
  providers: [LocalFileRepository, S3FileRepository],
  exports: [LocalFileRepository, S3FileRepository],
})
export class FileRepositoryModule {}
