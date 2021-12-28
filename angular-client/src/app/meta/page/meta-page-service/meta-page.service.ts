import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {MetaPage} from '../../../domain/meta.page';

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
