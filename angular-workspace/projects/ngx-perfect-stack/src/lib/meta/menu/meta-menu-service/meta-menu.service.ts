import {Inject, Injectable} from '@angular/core';
import {MenuItem, MenuItemType, MetaMenu} from '../../../domain/meta.menu';
import { HttpClient } from '@angular/common/http';
import {Subject, tap} from 'rxjs';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../../../ngx-perfect-stack-config';
import {withBypassAuth} from '../../../authentication/auth-interceptor';

@Injectable()
export class MetaMenuService {

  menu: MetaMenu = new MetaMenu();
  menuUpdated$ = new Subject<void>();

  constructor(
    @Inject(STACK_CONFIG)
    protected readonly stackConfig: NgxPerfectStackConfig,
    protected readonly http: HttpClient) { }

  initMenu() {
    return () => this.http.get(`${this.stackConfig.apiUrl}/meta/menu`, {
      context: withBypassAuth()
    }).pipe( tap((menu) => {
      this.menu = (menu as MetaMenu) || new MetaMenu();
    }));
  }

  getFirstLoginMenuItem(): MenuItem | null {
    const menu = this.menu?.menuList?.[0];
    if(menu && menu.items && menu.items.length > 0) {
      return menu.items.find((item) => item.type !== MenuItemType.Separator) || null;
    }
    return null;
  }

  find() {
    return this.http.get<MetaMenu>(`${this.stackConfig.apiUrl}/meta/menu`);
  }

  update(metaMenu: MetaMenu) {
    return this.http.post<void>(`${this.stackConfig.apiUrl}/meta/menu`, metaMenu).pipe(
      tap(() => {
        this.menu = JSON.parse(JSON.stringify(metaMenu)) as MetaMenu;
        this.menuUpdated$.next();
      })
    );
  }

  getPostGisVersion() {
    return this.http.get<any>(`${this.stackConfig.apiUrl}/meta/menu/postgis-version`);
  }

  createPostGisExtension() {
    return this.http.post<any>(`${this.stackConfig.apiUrl}/meta/menu/postgis-extension`, null);
  }
}
