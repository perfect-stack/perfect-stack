import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Person } from '../domain/person';
import { PersonService } from './person.service';

@Controller('person')
export class PersonController {
  constructor(private personService: PersonService) {}

  @Get('/query')
  findAll(
    @Query('nameCriteria') nameCriteria?: string,
    @Query('pageNumber') pageNumber?: number,
  ): Promise<Person[]> {
    return this.personService.findAll(nameCriteria, pageNumber);
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
