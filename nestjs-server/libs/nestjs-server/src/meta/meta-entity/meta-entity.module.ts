import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MetaEntityService } from './meta-entity.service';
import { MetaEntityController } from './meta-entity.controller';
import { OrmModule } from '../../orm/orm.module';
import { FileRepositoryModule } from '../../file/file-repository.module';
import { EventModule } from '../../event/event.module';
import { MetaEditGuard } from '../meta-edit/meta-edit.guard';

@Module({
  controllers: [MetaEntityController],
  imports: [ConfigModule, EventModule, OrmModule, FileRepositoryModule],
  providers: [MetaEntityService, MetaEditGuard],
  exports: [MetaEntityService],
})
export class MetaEntityModule {}
