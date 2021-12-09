import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { PageQueryResponse } from '../domain/response/page-query.response';
import { DataService } from './data.service';
import { Entity } from '../domain/entity';
import { EntityResponse } from '../domain/response/entity.response';

@Controller('data')
export class DataController {
  constructor(protected readonly dataService: DataService) {}

  @Get('/:entityName')
  findAll(
    @Param('entityName') entityName: string,
    @Query('pageNumber') pageNumber?: number,
    @Query('pageSize') pageSize?: number,
  ): Promise<PageQueryResponse<Entity>> {
    return;
  }

  @Get('/:entityName/:id')
  findOne(
    @Param('entityName') entityName: string,
    @Param('id') id: string,
  ): Promise<Entity> {
    return;
  }

  @Post('/:entityName/:id')
  create(
    @Param('entityName') entityName: string,
    @Body() entity: Entity,
  ): Promise<EntityResponse> {
    return;
  }

  @Put('/:entityName/:id')
  update(
    @Param('entityName') entityName: string,
    @Param('id') id: string,
  ): Promise<EntityResponse> {
    return;
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
