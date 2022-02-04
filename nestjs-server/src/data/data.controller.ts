import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { DataService } from './data.service';
import { Entity } from '../domain/entity';
import { EntityResponse } from '../domain/response/entity.response';
import { QueryRequest } from './query.request';

@Controller('data')
export class DataController {
  constructor(protected readonly dataService: DataService) {}

  @Get('/:entityName')
  findAll(
    @Param('entityName') entityName: string,
    @Query('pageNumber') pageNumber?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.dataService.findAll(entityName, pageNumber, pageSize);
  }

  @Post('/query')
  findByCriteria(@Body() queryRequest: QueryRequest) {
    return this.dataService.findByCriteria(queryRequest);
  }

  @Get('/:entityName/:id')
  findOne(
    @Param('entityName') entityName: string,
    @Param('id') id: string,
  ): Promise<Entity> {
    return this.dataService.findOne(entityName, id);
  }

  @Post('/:entityName/:id')
  save(
    @Param('entityName') entityName: string,
    @Body() entity: Entity,
  ): Promise<EntityResponse> {
    return this.dataService.save(entityName, entity);
  }

  @Delete('/:entityName/:id')
  archive(
    @Param('entityName') entityName: string,
    @Param('id') id: string,
  ): Promise<void> {
    return;
  }

  purge(): Promise<void> {
    return;
  }
}
