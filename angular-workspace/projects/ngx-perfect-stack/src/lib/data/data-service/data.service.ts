import {Inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {PageQueryResponse} from '../../domain/response/page-query.response';
import {Entity} from '../../domain/entity';
import {QueryRequest} from './query.request';
import {QueryResponse} from './query.response';
import {UpdateSortIndexRequest} from './update-sort-index.request';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../../ngx-perfect-stack-config';
import {SaveResponse} from './save.response';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(
    @Inject(STACK_CONFIG)
    protected readonly stackConfig: NgxPerfectStackConfig,
    protected readonly http: HttpClient) { }

  findAll(entityName: string, nameCriteria = "", pageNumber = 1, pageSize = 10) {
    return this.http.get<PageQueryResponse<Entity>>(`${this.stackConfig.apiUrl}/data/${entityName}?nameCriteria=${nameCriteria}&pageNumber=${pageNumber}&pageSize=${pageSize}`);
  }

  findByCriteria(queryRequest: QueryRequest) {
    return this.http.post<QueryResponse<Entity>>(`${this.stackConfig.apiUrl}/data/query`, queryRequest);
  }

  findById(entityName: string | null, id: string | null) {
    return this.http.get<Entity>(`${this.stackConfig.apiUrl}/data/${entityName}/${id}`);
  }

  save(entityName: string, entity: Entity) {
    return this.http.post<SaveResponse>(`${this.stackConfig.apiUrl}/data/${entityName}/${entity.id}`, entity);
  }

  updateSortIndex(updateSortIndexRequest: UpdateSortIndexRequest) {
    return this.http.post(`${this.stackConfig.apiUrl}/data/${updateSortIndexRequest.metaName}/${updateSortIndexRequest.id}/sort_index`, updateSortIndexRequest);
  }

  destroy(entityName: string, id: string) {
    return this.http.delete(`${this.stackConfig.apiUrl}/data/${entityName}/${id}`);
  }
}
