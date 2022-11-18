import { Controller, Get, Post } from '@nestjs/common';
import { ActionPermit } from '../authentication/action-permit';
import { ActionType } from '../domain/meta.role';
import { SubjectName } from '../authentication/subject';
import { CoordinateConverterService } from './coordinate-converter.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

export class CoordinateSummary {
  remainingCount: number;
}

@ApiTags('coordinates')
@Controller('coordinates')
export class CoordinateConverterController {
  constructor(
    protected readonly coordinateConverterService: CoordinateConverterService,
  ) {}

  @ActionPermit(ActionType.Read)
  @SubjectName('Meta')
  @ApiOperation({
    summary: 'Get the count of remaining rows that need WGS84 conversion',
  })
  @Get('/')
  async getSummary(): Promise<CoordinateSummary> {
    return this.coordinateConverterService.getSummary();
  }

  @ActionPermit(ActionType.Edit)
  @SubjectName('Meta')
  @ApiOperation({
    summary:
      'Batch job to convert records with NZTM values and null WGS84 values',
  })
  @Post()
  async convert(): Promise<CoordinateSummary> {
    console.log('Do conversion now');
    await this.coordinateConverterService.convert();
    return this.getSummary();
  }
}
