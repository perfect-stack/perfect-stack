import { Controller, Get, Param } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(protected readonly auditService: AuditService) {}

  @Get('/:id')
  async findAll(@Param('id') id: string) {
    return this.auditService.findAll(id);
  }
}
