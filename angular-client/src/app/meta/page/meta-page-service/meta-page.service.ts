import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Cell, MetaPage, Template} from '../../../domain/meta.page';
import {MetaAttribute, MetaEntity} from '../../../domain/meta.entity';


export class CellAttribute {
  width: string;
  height: string;
  attributeName?: string;
  attribute?: MetaAttribute;
}

@Injectable({
  providedIn: 'root'
})
export class MetaPageService {

  constructor(protected readonly http: HttpClient) { }

  findAll() {
    return this.http.get<MetaPage[]>(`http://localhost:3080/meta/page`);
  }

  findById(metaPageName: string | null) {
    return this.http.get<MetaPage>(`http://localhost:3080/meta/page/${metaPageName}`);
  }

  create(metaPage: MetaPage) {
    return this.http.post(`http://localhost:3080/meta/page/${metaPage.name}`, metaPage);
  }

  update(metaPage: MetaPage) {
    return this.http.put(`http://localhost:3080/meta/page/${metaPage.name}`, metaPage);
  }

}
