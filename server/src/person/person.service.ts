import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Person } from '../domain/person';
import { PageQueryResponse } from '../domain/response/page-query.response';
import { Op } from 'sequelize';

@Injectable()
export class PersonService {
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
}
