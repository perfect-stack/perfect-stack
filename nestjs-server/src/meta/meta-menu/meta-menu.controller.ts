import { Body, Controller, Get, Post } from '@nestjs/common';
import { MetaMenuService } from './meta-menu.service';
import { PublicApi } from '../../authentication/public-api';
import { MetaMenu } from '../../domain/meta.menu';
import { ActionPermit } from '../../authentication/action-permit';
import { ActionType } from '../../domain/meta.role';
import { SubjectName } from '../../authentication/subject';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('meta')
@Controller('meta/menu')
export class MetaMenuController {
  constructor(protected readonly metaMenuService: MetaMenuService) {}

  @PublicApi()
  @ApiOperation({
    summary: '[PUBLIC] Find the Meta Menu file (there is only one of them)',
  })
  @Get()
  findOne() {
    return this.metaMenuService.findOne();
  }

  @ActionPermit(ActionType.Edit)
  @SubjectName('Meta')
  @ApiOperation({
    summary: 'Updates the Meta Menu file supplied',
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
  @Get('/version')
  getVersion(): string {
    return this.metaMenuService.getVersion();
  }
}
