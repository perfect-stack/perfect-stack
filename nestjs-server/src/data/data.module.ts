import { Module } from '@nestjs/common';
import { DataController } from './data.controller';
import { DataService } from './data.service';
import { OrmModule } from '../orm/orm.module';
import { MetaEntityModule } from '../meta/meta-entity/meta-entity.module';
import { AuditModule } from '../audit/audit.module';
import { QueryService } from './query.service';

@Module({
  controllers: [DataController],
  imports: [AuditModule, MetaEntityModule, OrmModule],
  providers: [DataService, QueryService],
  exports: [DataService, QueryService],
})
export class DataModule {}
