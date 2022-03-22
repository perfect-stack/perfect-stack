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
import { UpdateSortIndexRequest } from './update-sort-index.request';

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

  @Post('/:entityName/:id/sort_index')
  updateSortIndex(
    @Param('entityName') entityName: string,
    @Param('id') id: string,
    @Body() updateSortIndexRequest: UpdateSortIndexRequest,
  ): Promise<void> {
    if (
      entityName !== updateSortIndexRequest.metaName ||
      id !== updateSortIndexRequest.id
    ) {
      throw new Error(
        `Invalid request. URL parameters do not match submitted request data`,
      );
    }
    return this.dataService.updateSortIndex(updateSortIndexRequest);
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
