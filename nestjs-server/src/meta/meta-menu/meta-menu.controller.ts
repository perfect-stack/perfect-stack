import { Body, Controller, Get, Post } from '@nestjs/common';
import { MetaMenuService } from './meta-menu.service';
import { PublicApi } from '../../authentication/public-api';
import { MetaMenu } from '../../domain/meta.menu';

@Controller('meta/menu')
export class MetaMenuController {
  constructor(protected readonly metaMenuService: MetaMenuService) {}

  @PublicApi()
  @Get()
  findOne() {
    return this.metaMenuService.findOne();
  }

  @Post()
  update(@Body() metaMenu: MetaMenu) {
    return this.metaMenuService.update(metaMenu);
  }
}
