import {Inject, Injectable} from '@angular/core';
import {MetaRole} from '../../../domain/meta.role';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../../../ngx-perfect-stack-config';
import {HttpClient} from '@angular/common/http';
import {tap} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MetaRoleService {

  metaRoles: MetaRole[];

  constructor(@Inject(STACK_CONFIG)
              protected readonly stackConfig: NgxPerfectStackConfig,
              protected readonly http: HttpClient) { }

  initMetaRoles() {
    // WARNING: there is some hack code in AuthInterceptor to allow it to bypass
    // authentication logic when the user is not logged in.
    return () => this.http.get(`${this.stackConfig.apiUrl}/meta/role`)
      .pipe( tap((metaRoles) => {
        this.metaRoles = metaRoles as MetaRole[];
      }));
  }

  findAll() {
    return this.http.get<MetaRole[]>(`${this.stackConfig.apiUrl}/meta/role`);
  }

  findById(metaRoleName: string | null) {
    return this.http.get<MetaRole>(`${this.stackConfig.apiUrl}/meta/role/${metaRoleName}`);
  }

  create(metaPage: MetaRole) {
    return this.http.post(`${this.stackConfig.apiUrl}/meta/role/${metaPage.name}`, metaPage);
  }

  update(metaPage: MetaRole) {
    return this.http.put(`${this.stackConfig.apiUrl}/meta/role/${metaPage.name}`, metaPage);
  }

  delete(metaPage: MetaRole) {
    return this.http.delete(`${this.stackConfig.apiUrl}/meta/role/${metaPage.name}`);
  }

}
