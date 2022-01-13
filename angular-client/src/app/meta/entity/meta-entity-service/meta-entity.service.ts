import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {MetaEntity} from '../../../domain/meta.entity';
import {environment} from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MetaEntityService {

  constructor(protected readonly http: HttpClient) { }

  findAll() {
    return this.http.get<MetaEntity[]>(`${environment.apiUrl}/meta/entity`);
  }

  findById(metaName: string | null) {
    return this.http.get<MetaEntity>(`${environment.apiUrl}/meta/entity/${metaName}`);
  }

  create(metaEntity: MetaEntity) {
    return this.http.post(`${environment.apiUrl}/meta/entity/${metaEntity.name}`, metaEntity);
  }

  update(metaEntity: MetaEntity) {
    return this.http.put(`${environment.apiUrl}/meta/entity/${metaEntity.name}`, metaEntity);
  }

  sync() {
    return this.http.post(`${environment.apiUrl}/meta/entity/database/sync`, null);
  }
}
