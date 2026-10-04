import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { MetaPageController } from './meta-page.controller';
import { MetaPageService } from './meta-page.service';
import { FileRepositoryModule } from '../../file/file-repository.module';
import { MetaEditGuard } from '../meta-edit/meta-edit.guard';

@Module({
  controllers: [MetaPageController],
  providers: [MetaPageService, MetaEditGuard, Reflector],
  imports: [ConfigModule, FileRepositoryModule],
})
export class MetaPageModule {}
