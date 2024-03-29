import { Module } from '@nestjs/common';
import { DataController } from './data.controller';
import { DataService } from './data.service';
import { OrmModule } from '../orm/orm.module';
import { MetaEntityModule } from '../meta/meta-entity/meta-entity.module';
import { AuditModule } from '../audit/audit.module';
import { QueryService } from './query.service';
import { CustomQueryService } from './custom-query.service';
import { RuleModule } from './rule/rule.module';
import { EventModule } from '../event/event.module';

@Module({
  controllers: [DataController],
  imports: [AuditModule, EventModule, MetaEntityModule, OrmModule, RuleModule],
  providers: [DataService, CustomQueryService, QueryService],
  exports: [DataService, CustomQueryService, QueryService],
})
export class DataModule {}
