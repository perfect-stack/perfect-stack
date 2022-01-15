import { Module } from '@nestjs/common';
import { databaseProviders } from './database.providers';
import { OrmService } from './orm.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [...databaseProviders, OrmService],
  exports: [OrmService],
})
export class OrmModule {}
