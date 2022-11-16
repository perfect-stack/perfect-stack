import {Inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../../ngx-perfect-stack-config';

@Injectable({
  providedIn: 'root'
})
export class CoordinateConverterService {

  constructor(@Inject(STACK_CONFIG)
              protected readonly stackConfig: NgxPerfectStackConfig,
              protected readonly http: HttpClient) { }

  getSummary() {
    return this.http.get(`${this.stackConfig.apiUrl}/coordinates`);
  }

  convert() {
    return this.http.post(`${this.stackConfig.apiUrl}/coordinates`, null);
  }
}
