import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { Person } from '../domain/person';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'fast-csv';
import { DateTimeFormatter, LocalDate } from '@js-joda/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository, QueryOrder } from '@mikro-orm/core';
import { PageQueryResponse } from '../domain/response/page-query.response';

@Injectable()
export class PersonService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PersonService.name);

  constructor(
    @InjectRepository(Person)
    protected readonly personRepository: EntityRepository<Person>,
    protected readonly em: EntityManager,
  ) {}

  async findAll(
    nameCriteria?: string,
    pageNumber = 1,
    pageSize = 10,
  ): Promise<PageQueryResponse<Person>> {
    this.logger.log(
      `findAll pageNumber = ${pageNumber}, nameCriteria = ${nameCriteria}`,
    );

    if (nameCriteria) {
      nameCriteria = nameCriteria + '%';
    } else {
      nameCriteria = '%';
    }

    if (!pageNumber) {
      pageNumber = 1;
    }

    const offset = (pageNumber - 1) * pageSize;

    const [results, resultSize] = await this.personRepository.findAndCount(
      { givenName: { $like: nameCriteria } },
      {
        orderBy: { givenName: QueryOrder.ASC },
        offset: offset,
        limit: pageSize,
      },
    );

    console.log(`Found ${results.length} of ${resultSize}`);

    return {
      resultList: results,
      totalCount: resultSize,
    };
  }

  async findOne(id: string): Promise<Person> {
    const person = await this.personRepository.findOne({ id: id });

    if (!person) {
      throw new HttpException('Person not found', HttpStatus.NOT_FOUND);
    }

    return person;
  }

  async save(personData: Person): Promise<Person> {
    console.log(`PersonService.save(): ${JSON.stringify(personData)}`);
    const personEntity = await this.findOne(personData.id);
    this.personRepository.assign(personEntity, personData);
    await this.personRepository.persistAndFlush(personEntity);
    return personEntity;
  }

  async onApplicationBootstrap(): Promise<any> {
    const personQueryResponse = await this.findAll(null);
    console.log(
      `onApplicationBootstrap() personList.length = ${personQueryResponse.totalCount}`,
    );
    if (personQueryResponse.totalCount === 0) {
      fs.createReadStream(
        path.resolve('etc', 'FakeNameGenerator.com_78362a93.csv'),
      )
        .pipe(csv.parse({ headers: true }))
        .on('error', (error) => this.logger.error(error))
        .on('data', (row) => this.createFakePerson(row))
        .on('end', (rowCount: number) => {
          this.personRepository.flush();
          this.logger.log(`Parsed and created ${rowCount} Person documents`);
        });
    } else {
      this.logger.log('Skipping Fake Person loading.');
    }
  }

  async createFakePerson(row: any) {
    // Number,Gender,NameSet,GivenName,Surname,StreetAddress,City,ZipCode,
    // EmailAddress,TelephoneNumber,TelephoneCountryCode,Birthday,
    // Occupation,Company,BloodType,Centimeters
    const fakeNameDateFormatter = DateTimeFormatter.ofPattern('M/d/yyyy');

    const birthday = LocalDate.parse(
      row.Birthday,
      fakeNameDateFormatter,
    ).format(DateTimeFormatter.ISO_LOCAL_DATE);

    const person: Person = {
      givenName: row.GivenName,
      familyName: row.Surname,
      emailAddress: row.EmailAddress,
      birthday: birthday,
      gender: row.Gender,
    };

    await this.save(person);
  }
}
