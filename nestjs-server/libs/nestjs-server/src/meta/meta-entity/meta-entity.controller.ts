import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { PublicApi } from '../../authentication/public-api';
import { MetaEntity } from '../../domain/meta.entity';
import { EntityResponse } from '../../domain/response/entity.response';
import { MetaEntityService } from './meta-entity.service';
import { ActionPermit } from '../../authentication/action-permit';
import { ActionType } from '../../domain/meta.role';
import { SubjectName } from '../../authentication/subject';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('meta')
@Controller('meta/entity')
export class MetaEntityController {
  constructor(protected readonly metaEntityService: MetaEntityService) {}

  @PublicApi()
  @ApiOperation({
    summary: '[PUBLIC] Get all Meta Entity files',
  })
  @Get('/')
  findAll(
    @Query('pageNumber') pageNumber?: number,
    @Query('pageSize') pageSize?: number,
  ): Promise<MetaEntity[]> {
    return this.metaEntityService.findAll();
  }

  @PublicApi()
  @ApiOperation({
    summary: '[PUBLIC] Get one Meta Entity file',
  })
  @Get('/:metaName')
  findOne(@Param('metaName') metaName: string): Promise<MetaEntity> {
    return this.metaEntityService.findOne(metaName);
  }

  @ActionPermit(ActionType.Edit)
  @ApiOperation({
    summary: 'Create a new Meta Entity file',
  })
  @SubjectName('Meta')
  @Post('/:metaName')
  create(
    @Param('metaName') metaName: string,
    @Body() metaEntity: MetaEntity,
  ): Promise<EntityResponse> {
    if (metaEntity.name !== metaName) {
      throw new Error(
        `Parameter metaName of "${metaName}" does not match the metaEntity name of "${metaEntity.name}"`,
      );
    }
    return this.metaEntityService.create(metaEntity);
  }

  @ActionPermit(ActionType.Edit)
  @SubjectName('Meta')
  @ApiOperation({
    summary: 'Update the supplied Meta Entity file',
  })
  @Put('/:metaName')
  update(
    @Param('metaName') metaName: string,
    @Body() metaEntity: MetaEntity,
  ): Promise<EntityResponse> {
    if (metaEntity.name !== metaName) {
      throw new Error(
        `Parameter metaName of "${metaName}" does not match the metaEntity name of "${metaEntity.name}"`,
      );
    }
    return this.metaEntityService.update(metaEntity);
  }

  @ActionPermit(ActionType.Delete)
  @ApiOperation({
    summary:
      'Delete the attribute of the Meta Entity optionally both in the file and in the database (deletes the column)',
  })
  @SubjectName('Meta')
  @Delete('/:metaName/:attributeName')
  deleteAttribute(
    @Param('metaName') metaName: string,
    @Param('attributeName') attributeName: string,
    @Query('deleteAttribute', ParseBoolPipe) deleteAttribute: boolean,
    @Query('deleteDatabaseCol', ParseBoolPipe) deleteDatabaseCol: boolean,
  ): Promise<void> {
    return this.metaEntityService.deleteAttribute({
      metaName,
      attributeName,
      deleteAttribute,
      deleteDatabaseCol,
    });
  }

  @ActionPermit(ActionType.Archive)
  @SubjectName('Meta')
  @ApiOperation({
    summary: 'Not implemented yet.',
  })
  @Delete('/:metaName')
  archive(): Promise<void> {
    return;
  }

  @ActionPermit(ActionType.Edit)
  @ApiOperation({
    summary:
      'Synchronize the Meta Entity files with the database. Creates new Tables and new columns in the database if needed.',
  })
  @SubjectName('Meta')
  @Post('/database/sync')
  sync() {
    return this.metaEntityService.syncMetaModelWithDatabase(true);
  }
}
