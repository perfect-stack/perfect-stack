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
import { PublicApi } from '../../authentication/public-api';
import { MetaPageService } from './meta-page.service';
import { MetaPage } from '../../domain/meta.page';
import { ActionPermit } from '../../authentication/action-permit';
import { ActionType } from '../../domain/meta.role';
import { SubjectName } from '../../authentication/subject';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('meta')
@Controller('meta/page')
export class MetaPageController {
  constructor(protected readonly metaPageService: MetaPageService) {}

  @PublicApi()
  @ApiOperation({
    summary: '[PUBLIC] Download all Meta Page files',
  })
  @Get('/')
  findAll(
    @Query('pageNumber') pageNumber?: number,
    @Query('pageSize') pageSize?: number,
  ): Promise<MetaPage[]> {
    return this.metaPageService.findAll();
  }

  @PublicApi()
  @ApiOperation({
    summary: '[PUBLIC] Gets the requested Meta Page',
  })
  @Get('/:metaPageName')
  findOne(@Param('metaPageName') metaPageName: string): Promise<MetaPage> {
    return this.metaPageService.findOne(metaPageName);
  }

  @ActionPermit(ActionType.Edit)
  @SubjectName('Meta')
  @ApiOperation({
    summary: 'Create a new Meta Page file with the supplied data',
  })
  @Post('/:metaPageName')
  create(
    @Param('metaPageName') metaPageName: string,
    @Body() metaPage: MetaPage,
  ): Promise<any> {
    if (metaPage.name !== metaPageName) {
      throw new Error(
        `Parameter metaPageName of "${metaPageName}" does not match the metaPage.name of "${metaPage.name}"`,
      );
    }
    return this.metaPageService.create(metaPage);
  }

  @ActionPermit(ActionType.Edit)
  @SubjectName('Meta')
  @ApiOperation({
    summary: 'Update the the supplied Meta Page',
  })
  @Put('/:metaPageName')
  update(
    @Param('metaPageName') metaPageName: string,
    @Body() metaPage: MetaPage,
  ): Promise<any> {
    if (metaPage.name !== metaPageName) {
      throw new Error(
        `Parameter metaPageName of "${metaPageName}" does not match the metaPage.name of "${metaPage.name}"`,
      );
    }
    return this.metaPageService.update(metaPage);
  }

  @ActionPermit(ActionType.Delete)
  @SubjectName('Meta')
  @ApiOperation({
    summary: 'Permanently deletes the requested Meta Page',
  })
  @Delete('/:metaPageName')
  delete(@Param('metaPageName') metaPageName: string): Promise<void> {
    return this.metaPageService.delete(metaPageName);
  }
}
