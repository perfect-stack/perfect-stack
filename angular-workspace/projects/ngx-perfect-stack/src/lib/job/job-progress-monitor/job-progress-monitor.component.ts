import {Component, effect, inject, input, resource, signal, Signal} from '@angular/core';
import {toObservable, toSignal} from "@angular/core/rxjs-interop";
import {catchError, of, switchMap} from "rxjs";
import {JobService} from "../job.service";



@Component({
  selector: 'lib-job-progress-monitor',
  imports: [],
  templateUrl: './job-progress-monitor.component.html',
  styleUrl: './job-progress-monitor.component.css'
})
export class JobProgressMonitorComponent {

  jobId = input<string | null>(null);
  jobService = inject(JobService);

  private readonly job$ = toObservable(this.jobId).pipe(
    switchMap(id => {
      if(id) {
        return this.jobService.getJob(id).pipe(
          catchError(err => {
            return of(null);
          })
        );
      }
      return of(null);
    })
  );

  job = toSignal(this.job$);


  constructor() {
  }
}
