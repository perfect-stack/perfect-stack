import { Module } from '@nestjs/common';
import { TypeaheadController } from './typeahead.controller';
import { TypeaheadService } from './typeahead.service';
import { OrmModule } from '../orm/orm.module';
import { MetaEntityModule } from '../meta/meta-entity/meta-entity.module';

@Module({
  controllers: [TypeaheadController],
  imports: [OrmModule, MetaEntityModule],
  providers: [TypeaheadService],
  exports: [TypeaheadService],
})
export class TypeaheadModule {}
