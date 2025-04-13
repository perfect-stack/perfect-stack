import { Module } from '@nestjs/common';
import { MediaRepositoryService } from './media-repository.service';
import { LocalMediaRepository } from './local-media-repository';
import { S3MediaRepository } from './s3-media-repository';
import { ConfigModule } from '@nestjs/config';
import {MediaController} from "./media.controller";

@Module({
  imports: [ConfigModule],
  controllers: [MediaController],
  providers: [MediaRepositoryService, LocalMediaRepository, S3MediaRepository],
  exports: [MediaRepositoryService],
})
export class MediaRepositoryModule {}

