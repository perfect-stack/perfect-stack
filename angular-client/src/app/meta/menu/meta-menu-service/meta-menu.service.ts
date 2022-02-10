import { Injectable } from '@angular/core';
import {MetaMenu} from '../../../domain/meta.menu';
import {HttpClient} from '@angular/common/http';
import {tap} from 'rxjs';
import {environment} from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MetaMenuService {

  menu: MetaMenu;

  // WARNING: there is some hack code in AuthInterceptor to allow it to bypass
  // authentication logic when the user is not logged in.

  constructor(protected readonly http: HttpClient) { }

  initMenu() {
    return () => this.http.get(`${environment.apiUrl}/meta/menu`)
      .pipe(
        tap((menu) => {
          this.menu = menu as MetaMenu;
        })
      );
  }

  find() {
    return this.http.get<MetaMenu>(`${environment.apiUrl}/meta/menu`);
  }

  update(metaMenu: MetaMenu) {
    return this.http.post<void>(`${environment.apiUrl}/meta/menu`, metaMenu);
  }
}
