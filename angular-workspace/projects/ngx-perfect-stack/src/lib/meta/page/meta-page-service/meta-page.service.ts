import {Inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ComponentData, LabelLayoutType, MetaPage, Template, Tool} from '../../../domain/meta.page';
import {MetaAttribute, MetaEntity} from '../../../domain/meta.entity';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../../../ngx-perfect-stack-config';
import {Observable, of, shareReplay, switchMap} from 'rxjs';


export class CellAttribute {
  width: string;
  height: string;
  attributeName?: string;
  hideLabel?: boolean;
  labelLayout?: LabelLayoutType;
  component?: string; // The "type" of component used to display stuff in this cell, e.g. "Page reference"
  tool?: Tool;
  metaEntity?: MetaEntity;
  attribute?: MetaAttribute;
  template?: Template;

  componentData?: ComponentData;
  noItemsHtml?: string; // Html displayed when no items
  footerHtml?: string; // Footer html that appears under the component (only in edit mode)
}

@Injectable({
  providedIn: 'root'
})
export class MetaPageService {

  // Caching strategy followed is here; https://blog.thoughtram.io/angular/2018/03/05/advanced-caching-with-rxjs.html
  private metaPageMapCache$: Observable<Map<string, MetaPage>>;

  constructor(
    @Inject(STACK_CONFIG)
    protected readonly stackConfig: NgxPerfectStackConfig,
    protected readonly http: HttpClient) { }

  get metaPageMap$() {
    if(!this.metaPageMapCache$) {
      this.metaPageMapCache$ = this.requestMetaPageMap().pipe(shareReplay(1));
    }
    return this.metaPageMapCache$;
  }

  private requestMetaPageMap() {
    return this.findAll().pipe(switchMap(list => {
      return of(new Map(
        list.map((a) => {
          return [a.name, a];
        })
      ));
    }));
  }

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

  delete(metaPage: MetaPage) {
    return this.http.delete(`${this.stackConfig.apiUrl}/meta/page/${metaPage.name}`);
  }

}
