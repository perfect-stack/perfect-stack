import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
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
  findAll(): Promise<MetaEntity[]> {
    return this.metaEntityService.findAll();
  }

  @PublicApi()
  @Get('/:metaName')
  findOne(@Param('metaName') metaName: string): Promise<MetaEntity> {
    return this.metaEntityService.findOne(metaName);
  }

  @PublicApi()
  @Post('/:metaName')
  create(@Body() metaEntity: MetaEntity): Promise<EntityResponse> {
    return;
  }

  @PublicApi()
  @Put('/:metaName')
  update(): Promise<EntityResponse> {
    return;
  }

  @PublicApi()
  @Delete('/:metaName')
  archive(): Promise<void> {
    return;
  }
}
