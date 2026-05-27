import { Controller, Get, Param } from '@nestjs/common';
import { AuditService } from './audit.service';
import { ActionPermit } from '../authentication/action-permit';
import { ActionType } from '../domain/meta.role';
import { SubjectName } from '../authentication/subject';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('audit')
@Controller('audit')
export class AuditController {
  constructor(protected readonly auditService: AuditService) {}

  @ActionPermit(ActionType.Read)
  @SubjectName('Audit')
  @ApiOperation({
    summary: 'Find all audit records for the supplied entity id',
  })
  @ApiResponse({
    status: 200,
    description: 'The list of audit records',
    type: [Object],
  })
  @Get('/:id')
  async findAll(@Param('id') id: string): Promise<any> {
    return this.auditService.findAll(id);
  }
}
