import { Module } from '@nestjs/common';
import { MetaPageController } from './meta-page.controller';
import { MetaPageService } from './meta-page.service';
import { FileRepositoryModule } from '../../file/file-repository.module';

@Module({
  controllers: [MetaPageController],
  providers: [MetaPageService],
  imports: [FileRepositoryModule],
})
export class MetaPageModule {}
