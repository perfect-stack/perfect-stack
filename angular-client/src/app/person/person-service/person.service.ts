import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Person} from '../../domain/person';
import {PageQueryResponse} from '../../domain/response/page-query.response';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PersonService {

  constructor(protected readonly http: HttpClient) { }

  findByCriteria(nameCriteria = "", pageNumber = 1, pageSize = 10) {
    return this.http.get<PageQueryResponse<Person>>(`${environment.apiUrl}/data/Person?nameCriteria=${nameCriteria}&pageNumber=${pageNumber}&pageSize=${pageSize}`);
  }

  findById(id: string | null) {
    return this.http.get<Person>(`${environment.apiUrl}/data/Person/${id}`);
  }

  create(person: Person) {
    return this.http.post(`${environment.apiUrl}/data/Person/${person.id}`, person);
  }

  update(person: Person) {
    return this.http.put(`${environment.apiUrl}/data/Person/${person.id}`, person);
  }
}
