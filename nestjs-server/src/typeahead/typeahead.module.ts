import { Module } from '@nestjs/common';
import { TypeaheadController } from './typeahead.controller';
import { TypeaheadService } from './typeahead.service';
import { OrmModule } from '../orm/orm.module';

@Module({
  controllers: [TypeaheadController],
  imports: [OrmModule],
  providers: [TypeaheadService],
})
export class TypeaheadModule {}
