import { Module } from '@nestjs/common';
import { PersonController } from './person.controller';
import { PersonService } from './person.service';
import { OrmModule } from '../orm/orm.module';
import { personsProviders } from './person.providers';

@Module({
  imports: [OrmModule],
  controllers: [PersonController],
  providers: [PersonService, ...personsProviders],
})
export class PersonModule {}
