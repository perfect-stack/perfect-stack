import { Module } from '@nestjs/common';
import { OrmModule } from '../orm/orm.module';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';

@Module({
  controllers: [AuditController],
  imports: [OrmModule],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
