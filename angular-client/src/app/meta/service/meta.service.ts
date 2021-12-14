import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {MetaEntity} from '../../domain/meta.entity';
import {MetaMenu} from '../../domain/meta.menu';
import {tap} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MetaService {

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

  findOne(metaName: string | null) {
    return this.http.get<MetaEntity>(`http://localhost:3080/meta/entity/${metaName}`);
  }

  findMenu() {
    return this.http.get<MetaMenu>(`http://localhost:3080/meta/menu`);
  }
}
