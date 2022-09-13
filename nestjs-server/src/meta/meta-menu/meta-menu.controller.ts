import { Body, Controller, Get, Post } from '@nestjs/common';
import { MetaMenuService } from './meta-menu.service';
import { PublicApi } from '../../authentication/public-api';
import { MetaMenu } from '../../domain/meta.menu';
import { ActionPermit } from '../../authentication/action-permit';
import { ActionType } from '../../domain/meta.role';
import { SubjectName } from '../../authentication/subject';

@Controller('meta/menu')
export class MetaMenuController {
  constructor(protected readonly metaMenuService: MetaMenuService) {}

  @PublicApi()
  @Get()
  findOne() {
    return this.metaMenuService.findOne();
  }

  @ActionPermit(ActionType.Edit)
  @SubjectName('Meta')
  @Post()
  update(@Body() metaMenu: MetaMenu) {
    return this.metaMenuService.update(metaMenu);
  }

  @Get('/version')
  @PublicApi()
  getVersion(): string {
    return this.metaMenuService.getVersion();
  }
}
