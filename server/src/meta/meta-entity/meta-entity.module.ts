import { Module } from '@nestjs/common';
import { MetaEntityService } from './meta-entity.service';
import { MetaEntityController } from './meta-entity.controller';
import { OrmModule } from '../../orm/orm.module';

@Module({
  controllers: [MetaEntityController],
  imports: [OrmModule],
  providers: [MetaEntityService],
  exports: [MetaEntityService],
})
export class MetaEntityModule {}
