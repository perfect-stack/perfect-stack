import {Inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../../ngx-perfect-stack-config';

@Injectable({
  providedIn: 'root'
})
export class ClientConfigService {

  constructor(
    @Inject(STACK_CONFIG)
    protected readonly stackConfig: NgxPerfectStackConfig,
    protected readonly http: HttpClient) { }

  getConfig() {
    return this.http.get<any>(`${this.stackConfig.apiUrl}/client/config`);
  }
}
