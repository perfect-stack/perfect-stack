import { Injectable } from '@angular/core';
import {MetaMenu} from '../../../domain/meta.menu';
import {HttpClient} from '@angular/common/http';
import {tap} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MetaMenuService {

  menu: MetaMenu;

  constructor(protected readonly http: HttpClient) { }

  initMenu() {
    return () => this.http.get("http://localhost:3080/meta/menu")
      .pipe(
        tap((menu) => {
          this.menu = menu as MetaMenu;
        })
      );
  }

  find() {
    return this.http.get<MetaMenu>(`http://localhost:3080/meta/menu`);
  }
}
