import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { MetaRoleController } from './meta-role.controller';
import { MetaRoleService } from './meta-role.service';
import { FileRepositoryModule } from '../../file/file-repository.module';
import { MetaEditGuard } from '../meta-edit/meta-edit.guard';

@Module({
  controllers: [MetaRoleController],
  providers: [MetaRoleService, MetaEditGuard, Reflector],
  imports: [ConfigModule, FileRepositoryModule],
  exports: [MetaRoleService],
})
export class MetaRoleModule {}
