import {Injectable} from '@angular/core';
import {JobService} from "../../job/job.service";
import {Observable} from "rxjs";
import {Job} from "../../job/job.model";

@Injectable({
  providedIn: 'root'
})
export class BatchService {

  constructor(protected readonly jobService: JobService) { }

  getList(): Observable<string[]> {
    return this.jobService.getJobList();
  }

  getSummary(batchJob: string): Observable<any> {
    return this.jobService.getJobSummary(batchJob);
  }

  execute(batchJob: string): Observable<Job> {
    return this.jobService.startJob(batchJob);
  }
}
