import { Controller, Get, Post } from '@nestjs/common';
import { ActionPermit } from '../authentication/action-permit';
import { ActionType } from '../domain/meta.role';
import { SubjectName } from '../authentication/subject';
import { CoordinateConverterService } from './coordinate-converter.service';

export class CoordinateSummary {
  remainingCount: number;
}

@Controller('coordinates')
export class CoordinateConverterController {
  constructor(
    protected readonly coordinateConverterService: CoordinateConverterService,
  ) {}

  @ActionPermit(ActionType.Read)
  @SubjectName('Meta')
  @Get('/')
  async getSummary(): Promise<CoordinateSummary> {
    return this.coordinateConverterService.getSummary();
  }

  @ActionPermit(ActionType.Edit)
  @SubjectName('Meta')
  @Post()
  async convert(): Promise<CoordinateSummary> {
    console.log('Do conversion now');
    await this.coordinateConverterService.convert();
    return this.getSummary();
  }
}
