import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { EntityResponse } from '../domain/response/entity.response';
import { MetaService } from './meta.service';
import { MetaEntity } from '../domain/meta.entity';
import { PublicApi } from '../authentication/public-api';

@Controller('meta')
export class MetaController {
  constructor(protected readonly metaService: MetaService) {}

  @PublicApi()
  @Get('/')
  findAll(): Promise<MetaEntity[]> {
    return this.metaService.findAll();
  }

  @PublicApi()
  @Get('/:metaName')
  findOne(@Param('metaName') metaName: string): Promise<MetaEntity> {
    return this.metaService.findOne(metaName);
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
