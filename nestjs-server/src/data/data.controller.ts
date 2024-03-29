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
import { CustomQueryService } from './custom-query.service';
import { ActionPermit } from '../authentication/action-permit';
import { ActionType } from '../domain/meta.role';
import { SubjectKey } from '../authentication/subject';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('data')
@Controller('data')
export class DataController {
  constructor(
    protected readonly auditService: AuditService,
    protected readonly dataService: DataService,
    protected readonly customQueryService: CustomQueryService,
    protected readonly queryService: QueryService,
  ) {}

  @ActionPermit(ActionType.Read)
  @SubjectKey('entityName')
  @ApiOperation({ summary: 'Find all data rows for the supplied entity name' })
  @Get('/:entityName')
  findAll(
    @Param('entityName') entityName: string,
    @Query('pageNumber') pageNumber?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.queryService.findAll(entityName, pageNumber, pageSize);
  }

  @ActionPermit(ActionType.Read)
  @SubjectKey('metaEntityName')
  @ApiOperation({
    summary:
      'Find all data rows for the supplied query request containing entity name and other criteria',
  })
  @Post('/query')
  findByCriteria(@Body() queryRequest: QueryRequest) {
    if (queryRequest.customQuery) {
      return this.customQueryService.findByCriteria(queryRequest);
    } else {
      return this.queryService.findByCriteria(queryRequest);
    }
  }

  @ActionPermit(ActionType.Read)
  @SubjectKey('entityName')
  @ApiOperation({ summary: 'Find one entity by entity name and id' })
  @Get('/:entityName/:id')
  findOne(
    @Param('entityName') entityName: string,
    @Param('id') id: string,
  ): Promise<Entity> {
    return this.queryService.findOne(entityName, id);
  }

  @ActionPermit(ActionType.Edit)
  @SubjectKey('entityName')
  @ApiOperation({
    summary:
      'Save (create/update) the supplied request body as the specified entity with the supplied id',
  })
  @Post('/:entityName/:id')
  async save(
    @Req() request: Request,
    @Param('entityName') entityName: string,
    @Body() entity: Entity,
  ): Promise<EntityResponse> {
    const startTime = Date.now();

    const entityResponse = await this.dataService.save(entityName, entity);

    if (entityResponse.action !== AuditAction.None) {
      await this.auditService.audit(
        request,
        entityName,
        entity.id,
        entityResponse.action,
        Date.now() - startTime,
      );
    }

    return entityResponse;
  }

  @ActionPermit(ActionType.Edit)
  @SubjectKey('entityName')
  @ApiOperation({
    summary: 'Update the sort index value for certain reference data types',
  })
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

  @ActionPermit(ActionType.Delete)
  @SubjectKey('entityName')
  @ApiOperation({
    summary:
      'Permanently deletes the supplied entity with the supplied id value',
  })
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

  @ActionPermit(ActionType.Delete)
  @SubjectKey('entityName')
  @ApiOperation({
    summary: 'Check if the entity with the supplied id value can be deleted',
  })
  @Delete('/check/:entityName/:id')
  async destroyCheck(
    @Param('entityName') entityName: string,
    @Param('id') id: string,
  ): Promise<any> {
    return this.dataService.destroyCheck(entityName, id);
  }

  purge(): Promise<void> {
    return;
  }
}
