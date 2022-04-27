import {Inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {MetaEntity} from '../../../domain/meta.entity';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../../../ngx-perfect-stack-config';
import {Observable, of, shareReplay, switchMap} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MetaEntityService {

  private metaEntityMapCache$: Observable<Map<string, MetaEntity>>;

  constructor(
    @Inject(STACK_CONFIG)
    protected readonly stackConfig: NgxPerfectStackConfig,
    protected readonly http: HttpClient) { }

  get metaEntityMap$() {
    if(!this.metaEntityMapCache$) {
      this.metaEntityMapCache$ = this.requestMetaEntityMap().pipe(shareReplay(1));
    }
    return this.metaEntityMapCache$;
  }

  private requestMetaEntityMap() {
    return this.findAll().pipe(switchMap(list => {
      return of(new Map(
        list.map((a) => {
          return [a.name, a];
        })
      ));
    }));
  }

  findAll() {
    return this.http.get<MetaEntity[]>(`${this.stackConfig.apiUrl}/meta/entity`);
  }

  findById(metaName: string | null) {
    if(metaName) {
      return this.http.get<MetaEntity>(`${this.stackConfig.apiUrl}/meta/entity/${metaName}`);
    }
    else {
      throw new Error(`MetaEntityService.findById() got invalid metaName. Check your config`);
    }
  }

  create(metaEntity: MetaEntity) {
    return this.http.post(`${this.stackConfig.apiUrl}/meta/entity/${metaEntity.name}`, metaEntity);
  }

  update(metaEntity: MetaEntity) {
    return this.http.put(`${this.stackConfig.apiUrl}/meta/entity/${metaEntity.name}`, metaEntity);
  }

  sync() {
    return this.http.post(`${this.stackConfig.apiUrl}/meta/entity/database/sync`, null);
  }

  createFakePeople() {
    return this.http.post(`${this.stackConfig.apiUrl}/admin/createFakePeople`, null);
  }

  deleteAttribute(metaName: string, attributeName: string, deleteAttribute: boolean, deleteDatabaseCol: boolean) {
    return this.http.delete(`${this.stackConfig.apiUrl}/meta/entity/${metaName}/${attributeName}?deleteAttribute=${deleteAttribute}&deleteDatabaseCol=${deleteDatabaseCol}`);
  }
}
