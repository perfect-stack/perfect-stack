import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {PageQueryResponse} from '../../domain/response/page-query.response';
import {Entity} from '../../domain/entity';
import {QueryRequest} from './query.request';
import {QueryResponse} from './query.response';
import {environment} from '../../../environments/environment';
import {UpdateSortIndexRequest} from './update-sort-index.request';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(protected readonly http: HttpClient) { }

  findAll(entityName: string, nameCriteria = "", pageNumber = 1, pageSize = 10) {
    return this.http.get<PageQueryResponse<Entity>>(`${environment.apiUrl}/data/${entityName}?nameCriteria=${nameCriteria}&pageNumber=${pageNumber}&pageSize=${pageSize}`);
  }

  findByCriteria(queryRequest: QueryRequest) {
    return this.http.post<QueryResponse<Entity>>(`${environment.apiUrl}/data/query`, queryRequest);
  }

  findById(entityName: string | null, id: string | null) {
    return this.http.get<Entity>(`${environment.apiUrl}/data/${entityName}/${id}`);
  }

  save(entityName: string, entity: Entity) {
    return this.http.post(`${environment.apiUrl}/data/${entityName}/${entity.id}`, entity);
  }

  updateSortIndex(updateSortIndexRequest: UpdateSortIndexRequest) {
    return this.http.post(`${environment.apiUrl}/data/${updateSortIndexRequest.metaName}/${updateSortIndexRequest.id}/sort_index`, updateSortIndexRequest);
  }
}
