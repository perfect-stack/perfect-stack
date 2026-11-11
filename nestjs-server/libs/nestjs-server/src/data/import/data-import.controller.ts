import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
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

  @ActionPermit(ActionType.Read)
  @SubjectName('Import')
  @ApiOperation({
    summary: 'Validate schema collisions and configuration for a data import format',
  })
  @ApiResponse({
    status: 200,
    description: 'Validation result containing valid boolean and list of error messages',
    type: Object,
  })
  @Get(':formatKey/schema-check')
  async validateSchema(
    @Param('formatKey') formatKey: string,
    @Query() params: Record<string, any>,
  ): Promise<{ valid: boolean; errors: string[] }> {
    return this.dataImportService.validateSchema(formatKey, params);
  }

  @ActionPermit(ActionType.Read)
  @SubjectName('Import')
  @ApiOperation({
    summary: 'Download a template (grid or dictionary) for a data import format',
  })
  @ApiResponse({
    status: 200,
    description: 'Template file stream',
  })
  @Get(':formatKey/template')
  async downloadTemplate(
    @Param('formatKey') formatKey: string,
    @Query('flavour') flavour: 'grid' | 'dictionary',
    @Query() params: Record<string, any>,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.dataImportService.generateTemplate(formatKey, params, flavour || 'grid');
    res.setHeader('Content-Type', result.contentType || 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.content);
  }
}
