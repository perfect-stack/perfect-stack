import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../../environments/environment';
import {Observable, switchMap} from 'rxjs';
import {Item, TypeaheadResponse} from './typeahead.response';

@Injectable({
  providedIn: 'root'
})
export class TypeaheadService {

  constructor(protected readonly http: HttpClient) { }

  /*search(typeaheadRequest: TypeaheadRequest): Observable<TypeaheadResponse> {
    return this.http.post<TypeaheadResponse>(`${environment.apiUrl}/typeahead`, typeaheadRequest);
  }*/

  search(term: string): Observable<Item[]> {
    const typeaheadRequest = {
      searchText: term
    }
    return this.http.post<Item[]>(`${environment.apiUrl}/typeahead`, typeaheadRequest);
  }
}
