import {Inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {MetaEntity} from '../../../domain/meta.entity';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../../../ngx-perfect-stack-config';

@Injectable({
  providedIn: 'root'
})
export class MetaEntityService {

  constructor(
    @Inject(STACK_CONFIG)
    protected readonly stackConfig: NgxPerfectStackConfig,
    protected readonly http: HttpClient) { }

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
