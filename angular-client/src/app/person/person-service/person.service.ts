import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Person} from '../../domain/person';
import {PageQueryResponse} from '../../domain/response/page-query.response';

@Injectable({
  providedIn: 'root'
})
export class PersonService {

  constructor(protected readonly http: HttpClient) { }

  findByCriteria(nameCriteria = "", pageNumber = 1, pageSize = 10) {
    return this.http.get<PageQueryResponse<Person>>(`http://localhost:3080/person/query?nameCriteria=${nameCriteria}&pageNumber=${pageNumber}&pageSize=${pageSize}`);
  }

  findById(id: string | null) {
    return this.http.get<Person>(`http://localhost:3080/person/${id}`);
  }

  create(person: Person) {
    return this.http.post(`http://localhost:3080/person`, person);
  }

  update(person: Person) {
    return this.http.put(`http://localhost:3080/person`, person);
  }
}
