import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Person } from '../domain/person';
import { PersonService } from './person.service';
import { PublicApi } from '../authentication/public-api';
import { PageQueryResponse } from '../domain/response/page-query.response';

@Controller('person')
export class PersonController {
  constructor(private personService: PersonService) {}

  @PublicApi()
  @Get('/query')
  findAll(
    @Query('nameCriteria') nameCriteria?: string,
    @Query('pageNumber') pageNumber?: number,
    @Query('pageSize') pageSize?: number,
  ): Promise<PageQueryResponse<Person>> {
    return this.personService.findAll(nameCriteria, pageNumber, pageSize);
  }

  @PublicApi()
  @Get(':id')
  findOne(@Param('id') id: string): Promise<Person> {
    return this.personService.findOne(id);
  }

  @PublicApi()
  @Post()
  save(@Body() person: Person): Promise<Person> {
    return this.personService.save(person);
  }
}
