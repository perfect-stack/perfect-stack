import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OrmModule } from '../orm/orm.module';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';

@Module({
  controllers: [AuditController],
  imports: [ConfigModule, OrmModule],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
