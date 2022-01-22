import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import * as csv from 'fast-csv';
import { v4 as uuid } from 'uuid';

import { DateTimeFormatter, LocalDate } from '@js-joda/core';
import { DataService } from '../data/data.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(protected readonly dataService: DataService) {}

  public async createFakePeople(): Promise<any> {
    const personQueryResponse = await this.dataService.findAll('Person');

    console.log(
      `loadFakePeople() personList.length = ${personQueryResponse.totalCount}`,
    );

    if (personQueryResponse.totalCount === 0) {
      // console.log(`cwd = ${process.cwd()}`);
      // const p = path.resolve(
      //   __dirname,
      //   './etc/FakeNameGenerator.com_78362a93.csv',
      // );
      // console.log(`path = ${p}`);
      //
      // const fileData = fs.readFileSync(p);
      // console.log('got file data');
      //
      // const exists = fs.existsSync(p);
      // console.log(`exists = ${exists}`);

      fs.createReadStream(
        path.resolve(__dirname, '../../etc/FakeNameGenerator.com_78362a93.csv'),
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
      id: uuid(),
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
