import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { Person } from '../domain/person';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'fast-csv';
import { DateTimeFormatter, LocalDate } from '@js-joda/core';
import { PageQueryResponse } from '../domain/response/page-query.response';
import { Op } from 'sequelize';

@Injectable()
export class PersonService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PersonService.name);

  constructor(
    @Inject('PERSONS_REPOSITORY')
    private personsRepository: typeof Person,
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

    const { count, rows } =
      await this.personsRepository.findAndCountAll<Person>({
        where: {
          givenName: {
            [Op.like]: nameCriteria,
          },
        },
        order: ['givenName'],
        offset: offset,
        limit: pageSize,
      });

    console.log(`Found ${rows.length} of ${count}`);

    return {
      resultList: rows,
      totalCount: count,
    };
  }

  async findOne(id: string): Promise<Person> {
    const person = Person.findByPk(id);

    if (!person) {
      throw new HttpException('Person not found', HttpStatus.NOT_FOUND);
    }

    return person;
  }

  async create(personData: any): Promise<Person> {
    console.log(`PersonService.create(): ${JSON.stringify(personData)}`);
    const person = await Person.create(personData);
    return personData;
  }

  async update(personData: Person): Promise<Person> {
    console.log(`PersonService.update(): ${JSON.stringify(personData)}`);
    const person = await this.findOne(personData.id);
    person.set(personData);
    await person.save();
    return personData;
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

    const personData = {
      givenName: row.GivenName,
      familyName: row.Surname,
      emailAddress: row.EmailAddress,
      birthday: birthday,
      gender: row.Gender,
    };

    await this.create(personData);
  }
}
