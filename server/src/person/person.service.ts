import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Person } from '../domain/person';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'fast-csv';
import admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import { DateTimeFormatter, LocalDate } from '@js-joda/core';
import firestore, {
  DocumentData,
  FieldValue,
  FirestoreDataConverter,
  Query,
  QueryDocumentSnapshot,
} from '@google-cloud/firestore';
import { plainToClass } from 'class-transformer';

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
      .withConverter(new ClassConverter())
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
    const docRef = db
      .collection('person')
      //      .withConverter(new PersonConvertor())
      .doc(person.id);
    await docRef.set(person);
    return person;
  }

  async onApplicationBootstrap(): Promise<any> {
    const personList = await this.findAll(null);
    if (personList.length === 0) {
      fs.createReadStream(
        path.resolve('etc', 'FakeNameGenerator.com_78362a93.csv'),
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
    // Number,Gender,NameSet,GivenName,Surname,StreetAddress,City,ZipCode,
    // EmailAddress,TelephoneNumber,TelephoneCountryCode,Birthday,
    // Occupation,Company,BloodType,Centimeters
    const fakeNameDateFormatter = DateTimeFormatter.ofPattern('M/d/yyyy');
    const person: Person = {
      givenName: row.GivenName,
      familyName: row.Surname,
      emailAddress: row.EmailAddress,
      birthday: LocalDate.parse(row.Birthday, fakeNameDateFormatter),
    };

    await this.save(person);
  }
}

class ClassConverter implements firestore.FirestoreDataConverter<Person> {
  fromFirestore(snapshot: FirebaseFirestore.QueryDocumentSnapshot): Person {
    const values = snapshot.data();
    return plainToClass(Person, values);
  }

  toFirestore(
    modelObject: Person | Partial<Person>,
    options?: FirebaseFirestore.SetOptions,
  ): FirebaseFirestore.DocumentData {
    const data: any = {
      ...modelObject,
    };

    return data;
  }
}
