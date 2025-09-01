import {Inject, Injectable} from '@angular/core';
import {NgxPerfectStackConfig, STACK_CONFIG} from "../../ngx-perfect-stack-config";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class BatchService {

  constructor(@Inject(STACK_CONFIG)
              protected readonly stackConfig: NgxPerfectStackConfig,
              protected readonly http: HttpClient) { }

  coordinateSummary() {
    return this.http.get(`${this.stackConfig.apiUrl}/coordinates`);
  }

  coordinateConvert() {
    return this.http.post(`${this.stackConfig.apiUrl}/coordinates`, null);
  }

  ageClassSummary() {
    return this.http.get(`${this.stackConfig.apiUrl}/batch/age_class`);
  }

  ageClassUpdate() {
    return this.http.post(`${this.stackConfig.apiUrl}/batch/age_class`, null);
  }
}
