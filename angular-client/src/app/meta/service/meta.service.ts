import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {MetaEntity} from '../../domain/meta.entity';

@Injectable({
  providedIn: 'root'
})
export class MetaService {

  constructor(protected readonly http: HttpClient) { }

  findOne(metaName: string | null) {
    return this.http.get<MetaEntity>(`http://localhost:3080/meta/${metaName}`);
  }
}
