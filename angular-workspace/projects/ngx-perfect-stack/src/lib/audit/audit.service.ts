import {Inject, Injectable} from '@angular/core';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../ngx-perfect-stack-config';
import { HttpClient } from '@angular/common/http';
import {Audit} from '../domain/audit';

@Injectable({
  providedIn: 'root'
})
export class AuditService {

  constructor(
    @Inject(STACK_CONFIG)
    protected readonly stackConfig: NgxPerfectStackConfig,
    protected readonly http: HttpClient) { }

  findAll(id: string) {
    return this.http.get<Audit[]>(`${this.stackConfig.apiUrl}/audit/${id}`);
  }
}
