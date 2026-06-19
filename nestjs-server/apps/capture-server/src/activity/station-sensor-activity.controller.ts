import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { StationSensorActivity } from '../domain';
import { StationSensorActivityService } from './station-sensor-activity.service';
import { ActionType } from '@perfect-stack/nestjs-server/domain/meta.role';
import { ActionPermit } from '@perfect-stack/nestjs-server/authentication/action-permit';
import { SubjectName } from '@perfect-stack/nestjs-server/authentication/subject';

@Controller('station-sensor-activity')
export class StationSensorActivityController {
  constructor(
    private readonly stationSensorActivityService: StationSensorActivityService,
  ) { }

  @Get()
  async findAll(
    @Query('pageNumber') pageNumber?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.stationSensorActivityService.findAll(pageNumber, pageSize);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.stationSensorActivityService.findOne(id);
  }

  @ActionPermit(ActionType.Edit)
  @SubjectName('StationSensorActivity')
  @Post()
  async save(@Body() activity: StationSensorActivity) {
    console.log('StationSensorActivityController: ', activity);
    return this.stationSensorActivityService.save(activity);
  }
}

