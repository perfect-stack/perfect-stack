import { Module } from '@nestjs/common';
import { DataController } from './data.controller';
import { DataService } from './data.service';
import { OrmModule } from '../orm/orm.module';

@Module({
  controllers: [DataController],
  imports: [OrmModule],
  providers: [DataService],
  exports: [DataService],
})
export class DataModule {}
