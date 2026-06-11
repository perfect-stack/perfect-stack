import {Inject, Injectable} from '@angular/core';
import {NgxPerfectStackConfig, STACK_CONFIG} from "../../ngx-perfect-stack-config";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class BatchService {

  constructor(@Inject(STACK_CONFIG)
              protected readonly stackConfig: NgxPerfectStackConfig,
              protected readonly http: HttpClient) { }

  getList(): Observable<string[]> {
    return this.http.get<string[]>(`${this.stackConfig.apiUrl}/batch/list`);
  }

  getSummary(batchJob: string) {
    return this.http.get(`${this.stackConfig.apiUrl}/batch/${batchJob}`);
  }

  execute(batchJob: string) {
    return this.http.post(`${this.stackConfig.apiUrl}/batch/${batchJob}`, null);
  }
}
