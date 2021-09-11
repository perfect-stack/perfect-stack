import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Person } from '../domain/person';
import * as fs from 'fs';
import csv from 'csv-parser';
import admin from 'firebase-admin';
import { uuid } from 'uuidv4';

// admin.initializeApp({
//   credential: admin.credential.applicationDefault(),
// });

admin.initializeApp();
const db = admin.firestore();

@Injectable()
export class PersonService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PersonService.name);

  async findAll(nameCriteria: string): Promise<Person[]> {
    this.logger.log(`findAll nameCriteria = ${nameCriteria}`);

    if (!nameCriteria) {
      nameCriteria = '';
    }

    const personRef = db.collection('person');
    const queryRef = personRef
      .where('givenName', '>=', nameCriteria)
      .where('givenName', '<=', nameCriteria + '\uf8ff');

    const personList: Person[] = [];
    const querySnapshot = await queryRef.orderBy('givenName').limit(20).get();
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
    !person.id ? (person.id = uuid()) : null;
    const docRef = db.collection('person').doc(person.id);
    await docRef.set(person);
    return person;
  }

  async onApplicationBootstrap(): Promise<any> {
    const personList = await this.findAll(null);
    if (personList.length === 0) {
      fs.createReadStream('etc/FakeNameGenerator.com_145b5e3e.csv')
        .pipe(csv())
        .on('data', (row) => {
          this.createFakePerson(row);
        })
        .on('end', () => {
          this.logger.log('Fake Person CSV file successfully processed');
        });
    } else {
      this.logger.log('Skipping Fake Person loading.');
    }
  }

  createFakePerson(row: any) {
    const person: Person = {
      givenName: row.GivenName,
      familyName: row.Surname,
      emailAddress: row.EmailAddress,
    };

    console.log('Create: ' + person.emailAddress);
    this.save(person);
  }
}
