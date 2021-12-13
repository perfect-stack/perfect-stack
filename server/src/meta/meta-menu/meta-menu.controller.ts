import { Controller, Get } from '@nestjs/common';
import { MetaMenuService } from './meta-menu.service';
import { PublicApi } from '../../authentication/public-api';

@Controller('meta/menu')
export class MetaMenuController {
  constructor(protected readonly metaMenuService: MetaMenuService) {}

  @PublicApi()
  @Get()
  findOne() {
    return this.metaMenuService.findOne();
  }
}
