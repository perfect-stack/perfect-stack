import {Component, effect, inject, input, output, signal} from '@angular/core';
import {toObservable, toSignal} from "@angular/core/rxjs-interop";
import {filter, map, merge, switchMap, takeUntil, takeWhile, tap, timer} from "rxjs";
import {JobService} from "../job.service";
import {Job} from "../job.model";
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

  jobId = input<string | null | undefined>(null);
  jobUpdated = output<any | null>();
  jobService = inject(JobService);
  timedOut = signal(false);

  private readonly jobId$ = toObservable(this.jobId);

  private readonly polling$ = this.jobId$.pipe(
    filter((id): id is string => !!id), // Only process valid, non-null IDs
    switchMap(id => { // When a new valid ID arrives, switch to a new polling stream that has its own completion logic
      this.timedOut.set(false); // Reset the timeout flag for the new job

      // timeout is set to be longer than the Job timeout so that the monitor waits until all hope is lost
      const timeout$ = timer(65 * 60000).pipe(tap(() => this.timedOut.set(true)));

      return timer(0, 2000).pipe(
        // For each tick, get the job
        switchMap(() => this.jobService.getJob(id)),
        // Stop polling if the job is "Completed" or "Error" or "Stopped", but emit the final value.
        takeWhile(job => job?.status !== 'Completed' && job?.status !== 'Error' && job?.status !== 'Stopped', true),
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

  getProgressValue(job: Job): number {
    if (!job) return 0;
    if (job.status === 'Completed') {
      return job.step_count > 0 ? job.step_count : 100;
    }
    if (job.step_count > 0) {
      return Math.min(job.step_count, job.step_index);
    }
    return 0;
  }

  getProgressMax(job: Job): number {
    if (!job) return 100;
    return job.step_count > 0 ? job.step_count : 100;
  }

  formatDuration(ms: number): string {
    if (ms == null || isNaN(ms) || ms < 0) return '';
    const totalSecs = Math.round(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    if (hours > 0) {
      return `${hours}h ${mins.toString().padStart(2, '0')}m`;
    }
    if (mins > 0) {
      return `${mins}m ${secs.toString().padStart(2, '0')}s`;
    }
    return `${secs}s`;
  }

  getElapsedTime(job: Job): string | null {
    if (!job) return null;
    const startTime = job.created_at ? new Date(job.created_at).getTime() : 0;
    const elapsedMs = (job.status === 'Processing' || job.status === 'Submitted') && startTime
      ? Math.max(0, Date.now() - startTime)
      : (job.duration && job.duration > 0 ? job.duration : 0);
    if (elapsedMs <= 0) return null;
    return this.formatDuration(elapsedMs);
  }

  getEstimatedCompletion(job: Job): string | null {
    if (!job || (job.status !== 'Processing' && job.status !== 'Submitted')) {
      return null;
    }
    const startTime = job.created_at ? new Date(job.created_at).getTime() : 0;
    const elapsedMs = (job.duration && job.duration > 0)
      ? job.duration
      : (startTime ? Math.max(0, Date.now() - startTime) : 0);

    if (elapsedMs <= 0) {
      return null;
    }

    if (job.step_count > 0 && job.step_index > 0) {
      const stepsCompleted = Math.min(job.step_count, job.step_index);
      const progress = stepsCompleted / job.step_count;
      if (progress > 0 && progress < 1) {
        const totalEstimatedMs = elapsedMs / progress;
        const remainingMs = Math.max(0, totalEstimatedMs - elapsedMs);
        const estDate = new Date(Date.now() + remainingMs);

        const clockTimeStr = estDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
        const nowDate = new Date();
        const isNextDay = estDate.toDateString() !== nowDate.toDateString();
        const daySuffix = isNextDay ? ' (tomorrow)' : '';

        const remainingStr = this.formatDuration(remainingMs);
        const totalStr = this.formatDuration(totalEstimatedMs);
        return `${clockTimeStr}${daySuffix} (~${remainingStr} remaining, ~${totalStr} total)`;
      }
    }
    return null;
  }
}
