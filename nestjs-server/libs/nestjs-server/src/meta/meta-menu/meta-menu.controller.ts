import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { MetaMenuService } from './meta-menu.service';
import { PublicApi } from '../../authentication/public-api';
import { MetaMenu } from '../../domain/meta.menu';
import { ActionPermit } from '../../authentication/action-permit';
import { ActionType } from '../../domain/meta.role';
import { SubjectName } from '../../authentication/subject';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MetaEditGuard } from '../meta-edit/meta-edit.guard';
import { MetaEditActionPermit } from '../meta-edit/meta-edit-action-permit.decorator';
import { MetaEditControlValue } from '../meta-edit/meta-edit-control-value';

@ApiTags('meta')
@Controller('meta/menu')
export class MetaMenuController {
  constructor(protected readonly metaMenuService: MetaMenuService) {}

  @PublicApi()
  @ApiOperation({
    summary: '[PUBLIC] Find the Meta Menu file (there is only one of them)',
  })
  @ApiResponse({
    status: 200,
    description: 'The Meta Menu',
    type: MetaMenu,
  })
  @Get()
  findOne() {
    return this.metaMenuService.findOne();
  }

  @UseGuards(MetaEditGuard)
  @MetaEditActionPermit(MetaEditControlValue.Menu)
  @ActionPermit(ActionType.Edit)
  @SubjectName('Meta')
  @ApiOperation({
    summary: 'Updates the Meta Menu file supplied',
  })
  @ApiResponse({
    status: 200,
    description: 'The updated Meta Menu',
    type: MetaMenu,
  })
  @Post()
  update(@Body() metaMenu: MetaMenu) {
    return this.metaMenuService.update(metaMenu);
  }

  @PublicApi()
  @ApiOperation({
    summary:
      '[PUBLIC] Get the server version number of the current release in this environment',
  })
  @ApiResponse({
    status: 200,
    description: 'The server version',
    type: String,
  })
  @Get('/version')
  getVersion(): string {
    return this.metaMenuService.getVersion();
  }

  @ActionPermit(ActionType.Edit)
  @SubjectName('Meta')
  @ApiOperation({
    summary: 'Get the PostGIS version from the database',
  })
  @ApiResponse({
    status: 200,
    description: 'The PostGIS version',
  })
  @Get('/postgis-version')
  getPostGisVersion() {
    return this.metaMenuService.getPostGisVersion();
  }

  @ActionPermit(ActionType.Edit)
  @SubjectName('Meta')
  @ApiOperation({
    summary: 'Create the PostGIS extension in the database',
  })
  @ApiResponse({
    status: 200,
    description: 'Result of creating PostGIS extension',
  })
  @Post('/postgis-extension')
  createPostGisExtension() {
    return this.metaMenuService.createPostGisExtension();
  }
}
