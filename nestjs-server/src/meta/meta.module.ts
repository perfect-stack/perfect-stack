import { Module } from '@nestjs/common';
import { MetaEntityModule } from './meta-entity/meta-entity.module';
import { MetaMenuModule } from './meta-menu/meta-menu.module';
import { MetaPageModule } from './meta-page/meta-page.module';

@Module({
  imports: [MetaEntityModule, MetaMenuModule, MetaPageModule],
  exports: [MetaEntityModule, MetaMenuModule, MetaPageModule],
})
export class MetaModule {}
