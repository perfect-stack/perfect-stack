import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { Person } from '../domain/person';
import { PersonService } from './person.service';

@Controller('person')
export class PersonController {
  constructor(private personService: PersonService) {}

  @Get()
  findAll(@Query('nameCriteria') nameCriteria?: string): Promise<Person[]> {
    return this.personService.findAll(nameCriteria);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Person> {
    return this.personService.findOne(id);
  }

  @Post()
  save(@Body() person: Person): Promise<Person> {
    return this.personService.save(person);
  }
}
