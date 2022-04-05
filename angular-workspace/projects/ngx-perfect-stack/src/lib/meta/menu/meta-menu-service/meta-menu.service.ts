import {Inject, Injectable} from '@angular/core';
import {MetaMenu} from '../../../domain/meta.menu';
import {HttpClient} from '@angular/common/http';
import {tap} from 'rxjs';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../../../ngx-perfect-stack-config';

@Injectable()
export class MetaMenuService {

  menu: MetaMenu;

  constructor(
    @Inject(STACK_CONFIG)
    protected readonly stackConfig: NgxPerfectStackConfig,
    protected readonly http: HttpClient) { }

  initMenu() {
    // WARNING: there is some hack code in AuthInterceptor to allow it to bypass
    // authentication logic when the user is not logged in.
    return () => this.http.get(`${this.stackConfig.apiUrl}/meta/menu`)
      .pipe( tap((menu) => {
        this.menu = menu as MetaMenu;
      }));
  }

  find() {
    return this.http.get<MetaMenu>(`${this.stackConfig.apiUrl}/meta/menu`);
  }

  update(metaMenu: MetaMenu) {
    return this.http.post<void>(`${this.stackConfig.apiUrl}/meta/menu`, metaMenu);
  }
}
