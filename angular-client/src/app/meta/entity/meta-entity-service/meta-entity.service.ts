import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {MetaEntity} from '../../../domain/meta.entity';

@Injectable({
  providedIn: 'root'
})
export class MetaEntityService {

  constructor(protected readonly http: HttpClient) { }

  findAll() {
    return this.http.get<MetaEntity[]>(`http://localhost:3080/meta/entity`);
  }

  findById(metaName: string | null) {
    return this.http.get<MetaEntity>(`http://localhost:3080/meta/entity/${metaName}`);
  }

  create(metaEntity: MetaEntity) {
    return this.http.post(`http://localhost:3080/meta/entity/${metaEntity.name}`, metaEntity);
  }

  update(metaEntity: MetaEntity) {
    return this.http.put(`http://localhost:3080/meta/entity/${metaEntity.name}`, metaEntity);
  }

  sync() {
    return this.http.post(`http://localhost:3080/meta/entity/database/sync`, null);
  }
}
