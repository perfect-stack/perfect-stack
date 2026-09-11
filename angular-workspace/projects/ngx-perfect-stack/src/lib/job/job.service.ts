import {Inject, Injectable} from '@angular/core';
import {Job} from "./job.model";
import {catchError, Observable, of} from "rxjs";
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

  getJobList(): Observable<string[]> {
    return this.http.get<string[]>(`${this.stackConfig.apiUrl}/job/list`).pipe(
      catchError(err => {
        console.error(err);
        return of([]);
      })
    );
  }

  getJobSummary(jobName: string): Observable<any> {
    return this.http.get<any>(`${this.stackConfig.apiUrl}/job/summary/${jobName}`).pipe(
      catchError(err => {
        console.error(err);
        return of(null);
      })
    );
  }

  startJob(jobName: string, payload: any = null): Observable<Job> {
    return this.http.post<Job>(`${this.stackConfig.apiUrl}/job/start/${jobName}`, payload);
  }

  getJob(jobId: string): Observable<Job | null> {
    return this.http.get<Job>(`${this.stackConfig.apiUrl}/job/${jobId}`).pipe(
      catchError(err => {
        console.error(err);
        return of(null);
      })
    );
  }
}
