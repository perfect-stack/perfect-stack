import { Module } from '@nestjs/common';
import { databaseProviders } from './database.providers';
import { OrmService } from './orm.service';

@Module({
  imports: [],
  providers: [...databaseProviders, OrmService],
  exports: [OrmService],
})
export class OrmModule {}
