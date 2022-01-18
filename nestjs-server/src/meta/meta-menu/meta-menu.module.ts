import { Module } from '@nestjs/common';
import { MetaMenuController } from './meta-menu.controller';
import { MetaMenuService } from './meta-menu.service';
import { FileRepositoryModule } from '../../file/file-repository.module';

@Module({
  controllers: [MetaMenuController],
  providers: [MetaMenuService],
  imports: [FileRepositoryModule],
})
export class MetaMenuModule {}
