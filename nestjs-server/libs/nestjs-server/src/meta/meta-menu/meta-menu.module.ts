import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MetaMenuController } from './meta-menu.controller';
import { MetaMenuService } from './meta-menu.service';
import { FileRepositoryModule } from '../../file/file-repository.module';
import { OrmModule } from '../../orm/orm.module';

@Module({
  controllers: [MetaMenuController],
  providers: [MetaMenuService],
  imports: [ConfigModule, FileRepositoryModule, OrmModule],
  exports: [MetaMenuService],
})
export class MetaMenuModule {}
