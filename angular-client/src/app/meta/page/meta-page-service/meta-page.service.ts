import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {MetaPage} from '../../../domain/meta.page';
import {MetaAttribute} from '../../../domain/meta.entity';
import {environment} from '../../../../environments/environment';


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
    return this.http.get<MetaPage[]>(`${environment.apiUrl}/meta/page`);
  }

  findById(metaPageName: string | null) {
    return this.http.get<MetaPage>(`${environment.apiUrl}/meta/page/${metaPageName}`);
  }

  create(metaPage: MetaPage) {
    return this.http.post(`${environment.apiUrl}/meta/page/${metaPage.name}`, metaPage);
  }

  update(metaPage: MetaPage) {
    return this.http.put(`${environment.apiUrl}/meta/page/${metaPage.name}`, metaPage);
  }

}
