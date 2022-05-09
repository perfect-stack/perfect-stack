import { Module } from '@nestjs/common';
import { OrmModule } from '../orm/orm.module';
import { AuditService } from './audit.service';

@Module({
  controllers: [],
  imports: [OrmModule],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
