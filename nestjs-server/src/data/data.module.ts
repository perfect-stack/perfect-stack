import { Module } from '@nestjs/common';
import { DataController } from './data.controller';
import { DataService } from './data.service';
import { OrmModule } from '../orm/orm.module';
import { MetaEntityModule } from '../meta/meta-entity/meta-entity.module';

@Module({
  controllers: [DataController],
  imports: [MetaEntityModule, OrmModule],
  providers: [DataService],
  exports: [DataService],
})
export class DataModule {}
