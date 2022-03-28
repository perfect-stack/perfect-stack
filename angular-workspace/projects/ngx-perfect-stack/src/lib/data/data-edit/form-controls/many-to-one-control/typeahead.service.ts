import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Item} from './typeahead.response';
import {TypeaheadRequest} from './typeahead.request';
import {MetaAttribute} from '../../../../domain/meta.entity';

@Injectable({
  providedIn: 'root'
})
export class TypeaheadService {

  environment = {
    apiUrl: 'http://localhost:3080'
  }

  constructor(protected readonly http: HttpClient) { }

  search(term: string, metaAttribute: MetaAttribute): Observable<Item[]> {
    const typeaheadRequest: TypeaheadRequest = {
      searchText: term,
      metaAttribute: metaAttribute,
      metaEntityName: 'XX'
    }
    return this.http.post<Item[]>(`${this.environment.apiUrl}/typeahead`, typeaheadRequest);
  }
}
