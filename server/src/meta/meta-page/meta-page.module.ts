import { Module } from '@nestjs/common';
import { MetaPageController } from './meta-page.controller';
import { MetaPageService } from './meta-page.service';

@Module({
  controllers: [MetaPageController],
  providers: [MetaPageService],
})
export class MetaPageModule {}
