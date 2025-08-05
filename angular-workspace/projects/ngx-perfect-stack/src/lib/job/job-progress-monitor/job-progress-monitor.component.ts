import {Component, effect, inject, input, resource, signal, Signal} from '@angular/core';
import {toObservable, toSignal} from "@angular/core/rxjs-interop";
import {filter, map, merge, switchMap, takeUntil, takeWhile, tap, timer} from "rxjs";
import {JobService} from "../job.service";
import {JsonPipe} from "@angular/common";
import {NgbProgressbar} from "@ng-bootstrap/ng-bootstrap";



@Component({
  selector: 'lib-job-progress-monitor',
  imports: [
    JsonPipe,
    NgbProgressbar
  ],
  templateUrl: './job-progress-monitor.component.html',
  styleUrl: './job-progress-monitor.component.css'
})
export class JobProgressMonitorComponent {

  jobId = input<string | null>(null);
  jobService = inject(JobService);
  timedOut = signal(false);

  private readonly jobId$ = toObservable(this.jobId);

  private readonly polling$ = this.jobId$.pipe(
    filter((id): id is string => !!id), // Only process valid, non-null IDs
    switchMap(id => { // When a new valid ID arrives, switch to a new polling stream that has its own completion logic
      this.timedOut.set(false); // Reset the timeout flag for the new job
      const timeout$ = timer(60000).pipe(tap(() => this.timedOut.set(true)));

      return timer(0, 3000).pipe(
        // For each tick, get the job
        switchMap(() => this.jobService.getJob(id)),
        // Stop polling if the job is "Completed", but emit the final value.
        takeWhile(job => job?.status !== 'Completed', true),
        // As a safeguard, stop polling after 60 seconds regardless of status.
        // This will also trigger the timeout$ to set the timedOut flag.
        takeUntil(timeout$)
      );
    })
  );

  private readonly null$ = this.jobId$.pipe(
    filter(id => !id), // Only process null or undefined IDs
    map(() => null) // When the ID is null, emit a null value
  );

  // Merge the two streams. The component will display the latest emission from either the polling stream or the null stream.
  job = toSignal(merge(this.polling$, this.null$));


  constructor() {
  }
}
