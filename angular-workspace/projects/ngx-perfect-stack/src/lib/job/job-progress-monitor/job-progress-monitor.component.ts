import {Component, effect, inject, input, output, signal} from '@angular/core';
import {toObservable, toSignal} from "@angular/core/rxjs-interop";
import {filter, map, merge, switchMap, takeUntil, takeWhile, tap, timer} from "rxjs";
import {JobService} from "../job.service";
import {NgbProgressbar} from "@ng-bootstrap/ng-bootstrap";



@Component({
  selector: 'lib-job-progress-monitor',
  imports: [
    NgbProgressbar
  ],
  templateUrl: './job-progress-monitor.component.html',
  styleUrl: './job-progress-monitor.component.css'
})
export class JobProgressMonitorComponent {

  jobId = input<string | null>(null);
  jobUpdated = output<any | null>();
  jobService = inject(JobService);
  timedOut = signal(false);

  private readonly jobId$ = toObservable(this.jobId);

  private readonly polling$ = this.jobId$.pipe(
    filter((id): id is string => !!id), // Only process valid, non-null IDs
    switchMap(id => { // When a new valid ID arrives, switch to a new polling stream that has its own completion logic
      this.timedOut.set(false); // Reset the timeout flag for the new job

      // timeout is set to be longer than the Lambda timeout so that the monitor waits until all hope is lost
      const timeout$ = timer(12 * 60000).pipe(tap(() => this.timedOut.set(true)));

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

  // The job signal is private and is updated by the polling logic.
  // Its value is exposed to parent components via the `jobUpdated` output.
  job = toSignal(merge(this.polling$, this.null$));

  constructor() {
    effect(() => {
      // Whenever the job signal changes, emit the new value to the parent component.
      this.jobUpdated.emit(this.job());
    });
  }
}
