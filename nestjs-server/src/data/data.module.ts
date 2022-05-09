import { Module } from '@nestjs/common';
import { DataController } from './data.controller';
import { DataService } from './data.service';
import { OrmModule } from '../orm/orm.module';
import { MetaEntityModule } from '../meta/meta-entity/meta-entity.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  controllers: [DataController],
  imports: [AuditModule, MetaEntityModule, OrmModule],
  providers: [DataService],
  exports: [DataService],
})
export class DataModule {}
