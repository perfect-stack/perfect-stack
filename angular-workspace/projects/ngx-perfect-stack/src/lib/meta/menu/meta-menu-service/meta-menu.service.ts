import {Inject, Injectable} from '@angular/core';
import {MetaMenu} from '../../../domain/meta.menu';
import {HttpClient} from '@angular/common/http';
import {tap} from 'rxjs';

@Injectable()
export class MetaMenuService {

  environment = {
    apiUrl: 'http://localhost:3080'
  }

  menu: MetaMenu;

  // WARNING: there is some hack code in AuthInterceptor to allow it to bypass
  // authentication logic when the user is not logged in.

  constructor(
    // @Inject('environment')
    // protected readonly environment: any,
    protected readonly http: HttpClient) { }

  initMenu() {
    return () => this.http.get(`${this.environment.apiUrl}/meta/menu`)
      .pipe(
        tap((menu) => {
          this.menu = menu as MetaMenu;
        })
      );
  }

  find() {
    return this.http.get<MetaMenu>(`${this.environment.apiUrl}/meta/menu`);
  }

  update(metaMenu: MetaMenu) {
    return this.http.post<void>(`${this.environment.apiUrl}/meta/menu`, metaMenu);
  }
}
