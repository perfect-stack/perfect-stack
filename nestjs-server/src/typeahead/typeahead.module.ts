import { Module } from '@nestjs/common';
import { TypeaheadController } from './Typeahead.controller';
import { TypeaheadService } from './Typeahead.service';
import { OrmModule } from '../orm/orm.module';

@Module({
  controllers: [TypeaheadController],
  imports: [OrmModule],
  providers: [TypeaheadService],
})
export class TypeaheadModule {}
