import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ActionPermit } from '../../authentication/action-permit';
import { ActionType } from '../../domain/meta.role';
import { SubjectName } from '../../authentication/subject';
import { DataImportService } from './data-import.service';
import { DataImportClientMapping } from './data-import.types';

@ApiTags('data-import')
@Controller('data-import')
export class DataImportController {
  constructor(protected readonly dataImportService: DataImportService) {}

  @ActionPermit(ActionType.Read)
  @SubjectName('Import')
  @ApiOperation({
    summary: 'Get all data formats in DataImportClientMapping format sorted by title ascending',
  })
  @ApiResponse({
    status: 200,
    description: 'List of DataImportClientMapping objects',
    type: Object,
  })
  @Get()
  getDataImportClientMapping(): DataImportClientMapping[] {
    return this.dataImportService.getDataImportClientMapping();
  }
}
