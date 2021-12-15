import { Injectable } from '@angular/core';
import {MetaMenu} from '../../../domain/meta.menu';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class MetaMenuService {

  constructor(protected readonly http: HttpClient) { }

  find() {
    return this.http.get<MetaMenu>(`http://localhost:3080/meta/menu`);
  }
}
