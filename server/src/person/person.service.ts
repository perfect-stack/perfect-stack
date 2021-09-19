import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Person } from '../domain/person';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'fast-csv';
import admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';

admin.initializeApp();
const db = admin.firestore();

@Injectable()
export class PersonService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PersonService.name);

  async findAll(nameCriteria?: string, pageNumber?: number): Promise<Person[]> {
    this.logger.log(
      `findAll pageNumber = ${pageNumber}, nameCriteria = ${nameCriteria}`,
    );

    if (!nameCriteria) {
      nameCriteria = '';
    }

    if (!pageNumber) {
      pageNumber = 1;
    }

    const pageSize = 20;
    const offset = (pageNumber - 1) * pageSize;

    const personRef = db.collection('person');
    const queryRef = personRef
      .where('givenName', '>=', nameCriteria)
      .where('givenName', '<=', nameCriteria + '\uf8ff');

    const querySnapshot = await queryRef
      .orderBy('givenName')
      .offset(offset)
      .limit(20)
      .get();

    const personList: Person[] = [];
    querySnapshot.forEach((doc) => {
      personList.push(<Person>doc.data());
    });

    return personList;
  }

  async findOne(id: string): Promise<Person> {
    const personRef = db.collection('person');
    const doc = await personRef.doc(id).get();
    return <Person>doc.data();
  }

  async save(person: Person): Promise<Person> {
    !person.id ? (person.id = uuidv4()) : null;
    const docRef = db.collection('person').doc(person.id);
    await docRef.set(person);
    return person;
  }

  async onApplicationBootstrap(): Promise<any> {
    const personList = await this.findAll(null);
    if (personList.length === 0) {
      fs.createReadStream(
        path.resolve('etc', 'FakeNameGenerator.com_145b5e3e.csv'),
      )
        .pipe(csv.parse({ headers: true }))
        .on('error', (error) => this.logger.error(error))
        .on('data', (row) => this.createFakePerson(row))
        .on('end', (rowCount: number) =>
          this.logger.log(`Parsed and created ${rowCount} Person documents`),
        );
    } else {
      this.logger.log('Skipping Fake Person loading.');
    }
  }

  async createFakePerson(row: any) {
    const person: Person = {
      givenName: row.GivenName,
      familyName: row.Surname,
      emailAddress: row.EmailAddress,
    };

    await this.save(person);
  }
}
