import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { DataService } from './data.service';
import { Entity } from '../domain/entity';
import { EntityResponse } from '../domain/response/entity.response';
import { QueryRequest } from './query.request';
import { UpdateSortIndexRequest } from './update-sort-index.request';
import { Request } from 'express';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../domain/audit';
import { QueryService } from './query.service';

@Controller('data')
export class DataController {
  constructor(
    protected readonly auditService: AuditService,
    protected readonly dataService: DataService,
    protected readonly queryService: QueryService,
  ) {}

  @Get('/:entityName')
  findAll(
    @Param('entityName') entityName: string,
    @Query('pageNumber') pageNumber?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.queryService.findAll(entityName, pageNumber, pageSize);
  }

  @Post('/query')
  findByCriteria(@Body() queryRequest: QueryRequest) {
    return this.queryService.findByCriteria(queryRequest);
  }

  @Get('/:entityName/:id')
  findOne(
    @Param('entityName') entityName: string,
    @Param('id') id: string,
  ): Promise<Entity> {
    return this.queryService.findOne(entityName, id);
  }

  @Post('/:entityName/:id')
  async save(
    @Req() request: Request,
    @Param('entityName') entityName: string,
    @Body() entity: Entity,
  ): Promise<EntityResponse> {
    const startTime = Date.now();

    const entityResponse = await this.dataService.save(entityName, entity);

    await this.auditService.audit(
      request,
      entityName,
      entity.id,
      entityResponse.action,
      Date.now() - startTime,
    );

    return entityResponse;
  }

  @Post('/:entityName/:id/sort_index')
  async updateSortIndex(
    @Req() request: Request,
    @Param('entityName') entityName: string,
    @Param('id') id: string,
    @Body() updateSortIndexRequest: UpdateSortIndexRequest,
  ): Promise<void> {
    const startTime = Date.now();

    if (
      entityName !== updateSortIndexRequest.metaName ||
      id !== updateSortIndexRequest.id
    ) {
      throw new Error(
        `Invalid request. URL parameters do not match submitted request data`,
      );
    }
    const response = this.dataService.updateSortIndex(updateSortIndexRequest);

    await this.auditService.audit(
      request,
      entityName,
      id,
      AuditAction.Update,
      Date.now() - startTime,
    );

    return response;
  }

  @Delete('/:entityName/:id')
  async destroy(
    @Req() request: Request,
    @Param('entityName') entityName: string,
    @Param('id') id: string,
  ): Promise<any> {
    const startTime = Date.now();

    const response = this.dataService.destroy(entityName, id);

    await this.auditService.audit(
      request,
      entityName,
      id,
      AuditAction.Delete,
      Date.now() - startTime,
    );

    return response;
  }

  purge(): Promise<void> {
    return;
  }
}
