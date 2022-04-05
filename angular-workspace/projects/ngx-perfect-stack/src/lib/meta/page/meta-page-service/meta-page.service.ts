import {Inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {MetaPage} from '../../../domain/meta.page';
import {MetaAttribute} from '../../../domain/meta.entity';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../../../ngx-perfect-stack-config';


export class CellAttribute {
  width: string;
  height: string;
  attributeName?: string;
  component?: string; // The "type" of component used to display stuff in this cell, e.g. "Page reference"
  attribute?: MetaAttribute;
}

@Injectable({
  providedIn: 'root'
})
export class MetaPageService {

  constructor(
    @Inject(STACK_CONFIG)
    protected readonly stackConfig: NgxPerfectStackConfig,
    protected readonly http: HttpClient) { }

  findAll() {
    return this.http.get<MetaPage[]>(`${this.stackConfig.apiUrl}/meta/page`);
  }

  findById(metaPageName: string | null) {
    return this.http.get<MetaPage>(`${this.stackConfig.apiUrl}/meta/page/${metaPageName}`);
  }

  create(metaPage: MetaPage) {
    return this.http.post(`${this.stackConfig.apiUrl}/meta/page/${metaPage.name}`, metaPage);
  }

  update(metaPage: MetaPage) {
    return this.http.put(`${this.stackConfig.apiUrl}/meta/page/${metaPage.name}`, metaPage);
  }

}
