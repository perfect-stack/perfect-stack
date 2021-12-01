import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Person} from '../../domain/person';

@Injectable({
  providedIn: 'root'
})
export class PersonService {

  constructor(protected readonly http: HttpClient) { }

  findByCriteria(nameCriteria = "", pageNumber = 1) {
    return this.http.get<Person[]>(`http://localhost:3080/person/query?nameCriteria=${nameCriteria}&pageNumber=${pageNumber}`);
  }
}
