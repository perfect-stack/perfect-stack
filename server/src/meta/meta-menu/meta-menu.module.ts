import { Module } from '@nestjs/common';
import { MetaMenuController } from './meta-menu.controller';
import { MetaMenuService } from './meta-menu.service';

@Module({
  controllers: [MetaMenuController],
  providers: [MetaMenuService],
})
export class MetaMenuModule {}
