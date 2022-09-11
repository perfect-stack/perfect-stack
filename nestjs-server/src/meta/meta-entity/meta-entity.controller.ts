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

@Controller('meta/entity')
export class MetaEntityController {
  constructor(protected readonly metaEntityService: MetaEntityService) {}

  @PublicApi()
  @Get('/')
  findAll(
    @Query('pageNumber') pageNumber?: number,
    @Query('pageSize') pageSize?: number,
  ): Promise<MetaEntity[]> {
    return this.metaEntityService.findAll();
  }

  @PublicApi()
  @Get('/:metaName')
  findOne(@Param('metaName') metaName: string): Promise<MetaEntity> {
    return this.metaEntityService.findOne(metaName);
  }

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

  @Delete('/:metaName')
  archive(): Promise<void> {
    return;
  }

  @Post('/database/sync')
  sync() {
    return this.metaEntityService.syncMetaModelWithDatabase(true);
  }
}
