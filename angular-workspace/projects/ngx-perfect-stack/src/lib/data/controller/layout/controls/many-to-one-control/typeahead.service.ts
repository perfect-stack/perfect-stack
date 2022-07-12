import {Inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Item} from './typeahead.response';
import {TypeaheadRequest} from './typeahead.request';
import {MetaAttribute, MetaEntity} from '../../../../../domain/meta.entity';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../../../../../ngx-perfect-stack-config';

@Injectable({
  providedIn: 'root'
})
export class TypeaheadService {

  constructor(
    @Inject(STACK_CONFIG)
    protected readonly stackConfig: NgxPerfectStackConfig,
    protected readonly http: HttpClient) { }

  search(term: string, metaEntity: MetaEntity, metaAttribute: MetaAttribute): Observable<Item[]> {
    const typeaheadRequest: TypeaheadRequest = {
      searchText: term,
      searchId: null,
      metaAttribute: metaAttribute,
      metaEntityName: metaEntity.name,
    }
    return this.http.post<Item[]>(`${this.stackConfig.apiUrl}/typeahead`, typeaheadRequest);
  }

  searchById(id: string, metaEntity: MetaEntity, metaAttribute: MetaAttribute): Observable<Item[]> {
    const typeaheadRequest: TypeaheadRequest = {
      searchText: null,
      searchId: id,
      metaAttribute: metaAttribute,
      metaEntityName: metaEntity.name,
    }
    return this.http.post<Item[]>(`${this.stackConfig.apiUrl}/typeahead`, typeaheadRequest);
  }
}
