import { Module } from '@nestjs/common';
import { MetaEntityService } from './meta-entity.service';
import { MetaEntityController } from './meta-entity.controller';
import { OrmModule } from '../../orm/orm.module';
import { FileRepositoryModule } from '../../file/file-repository.module';
import { EventModule } from "../../event/event.module";

@Module({
  controllers: [MetaEntityController],
  imports: [EventModule, OrmModule, FileRepositoryModule],
  providers: [MetaEntityService],
  exports: [MetaEntityService],
})
export class MetaEntityModule {}
