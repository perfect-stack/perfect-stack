import { Controller, Get, Param } from '@nestjs/common';
import { AuditService } from './audit.service';
import { ActionPermit } from '../authentication/action-permit';
import { ActionType } from '../domain/meta.role';
import { SubjectName } from '../authentication/subject';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('audit')
@Controller('audit')
export class AuditController {
  constructor(protected readonly auditService: AuditService) {}

  @ActionPermit(ActionType.Read)
  @SubjectName('Audit')
  @ApiOperation({
    summary: 'Find all audit records for the supplied entity id',
  })
  @Get('/:id')
  async findAll(@Param('id') id: string) {
    return this.auditService.findAll(id);
  }
}
