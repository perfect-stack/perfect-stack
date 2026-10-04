import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { MetaMenuController } from './meta-menu.controller';
import { MetaMenuService } from './meta-menu.service';
import { FileRepositoryModule } from '../../file/file-repository.module';
import { OrmModule } from '../../orm/orm.module';
import { MetaEditGuard } from '../meta-edit/meta-edit.guard';

@Module({
  controllers: [MetaMenuController],
  providers: [MetaMenuService, MetaEditGuard, Reflector],
  imports: [ConfigModule, FileRepositoryModule, OrmModule],
  exports: [MetaMenuService],
})
export class MetaMenuModule {}
