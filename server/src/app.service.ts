import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataService } from './data/data.service';
import * as fs from 'fs';
import * as csv from 'fast-csv';
import { DateTimeFormatter, LocalDate } from '@js-joda/core';
import * as path from 'path';
import { v4 } from 'uuid';
import { MetaEntityService } from './meta/meta-entity/meta-entity.service';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AppService.name);

  constructor(
    protected readonly metaEntityService: MetaEntityService,
    protected readonly dataService: DataService,
  ) {}

  get(): string {
    this.logger.log('Health check is ok.');
    return `Health check ok at: ${new Date().toISOString()}`;
  }

  async onApplicationBootstrap(): Promise<any> {
    await this.metaEntityService.syncMetaModelWithDatabase(false);
    //await this.loadFakePeople();
    return;
  }

  async loadFakePeople(): Promise<any> {
    const personQueryResponse = await this.dataService.findAll('Person');

    console.log(
      `onApplicationBootstrap() personList.length = ${personQueryResponse.totalCount}`,
    );

    if (personQueryResponse.totalCount === 0) {
      const p = path.resolve('etc', 'FakeNameGenerator.com_78362a93.csv');
      console.log(`path = ${p}`);

      const fileData = fs.readFileSync(p);
      console.log('got file data');

      const exists = fs.existsSync(p);
      console.log(`exists = ${exists}`);

      await fs
        .createReadStream(
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
      id: v4(),
      given_name: row.GivenName,
      family_name: row.Surname,
      email_address: row.EmailAddress,
      gender: row.Gender,
      street_address: row.StreetAddress,
      city: row.City,
      postcode: row.ZipCode,
      birthday: birthday,
      occupation: row.Occupation,
      company: row.Company,
    };

    await this.dataService.create('Person', personData);
  }
}
