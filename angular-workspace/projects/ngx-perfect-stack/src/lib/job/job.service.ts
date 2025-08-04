import {Inject, Injectable} from '@angular/core';
import {Job} from "./job.model";
import {Observable} from "rxjs";
import {NgxPerfectStackConfig, STACK_CONFIG} from "../ngx-perfect-stack-config";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class JobService {

  constructor(
    @Inject(STACK_CONFIG)
    protected readonly stackConfig: NgxPerfectStackConfig,
    protected readonly http: HttpClient) { }


  getJob(jobId: string): Observable<Job> {
    return this.http.get<Job>(`${this.stackConfig.apiUrl}/job/${jobId}`);
  }
}
