import { Controller, Get, Param } from '@nestjs/common';
import { AuditService } from './audit.service';
import { ActionPermit } from '../authentication/action-permit';
import { ActionType } from '../domain/meta.role';
import { SubjectName } from '../authentication/subject';

@Controller('audit')
export class AuditController {
  constructor(protected readonly auditService: AuditService) {}

  @ActionPermit(ActionType.Read)
  @SubjectName('Audit')
  @Get('/:id')
  async findAll(@Param('id') id: string) {
    return this.auditService.findAll(id);
  }
}
