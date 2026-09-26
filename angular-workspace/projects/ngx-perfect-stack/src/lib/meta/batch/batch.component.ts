import {ChangeDetectorRef, Component, Inject, OnInit} from '@angular/core';
import { CommonModule } from "@angular/common";
import {NgxPerfectStackConfig, STACK_CONFIG} from "../../ngx-perfect-stack-config";
import {BatchService} from "./batch.service";
import {ToastService} from "../../utils/toasts/toast.service";
import {JobService} from "../../job/job.service";
import {JobProgressMonitorComponent} from "../../job/job-progress-monitor/job-progress-monitor.component";
import {Job} from "../../job/job.model";

interface BatchJobSummary {
  name: string;
  summary: any;
  lastJob?: Job | null;
  currentJobId?: string | null;
  isRunning?: boolean;
  isStopping?: boolean;
}

@Component({
  selector: 'lib-batch',
  imports: [
    CommonModule,
    JobProgressMonitorComponent
],
  templateUrl: './batch.component.html',
  styleUrl: './batch.component.css'
})
export class BatchComponent implements OnInit {

  batchJobs: BatchJobSummary[] = [];

  constructor(@Inject(STACK_CONFIG)
              protected readonly stackConfig: NgxPerfectStackConfig,
              protected readonly batchService: BatchService,
              protected readonly jobService: JobService,
              protected readonly toastService: ToastService,
              protected readonly cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.jobService.getJobList().subscribe(jobs => {
      this.batchJobs = jobs.map(name => ({
        name,
        summary: null,
        lastJob: null,
        currentJobId: null,
        isRunning: false,
        isStopping: false
      }));
      this.batchJobs.forEach(job => {
        this.getSummary(job.name);
        this.getLatestJob(job.name);
      });
      this.cdr.markForCheck();
    });
  }

  getSummary(jobName: string) {
    this.jobService.getJobSummary(jobName).subscribe(summary => {
      const job = this.batchJobs.find(j => j.name === jobName);
      if (job) {
        job.summary = summary;
        this.cdr.markForCheck();
      }
    });
  }

  getLatestJob(jobName: string) {
    this.jobService.getLatestJob(jobName).subscribe(latestJob => {
      const job = this.batchJobs.find(j => j.name === jobName);
      if (job) {
        job.lastJob = latestJob;
        if (latestJob && (latestJob.status === 'Processing' || latestJob.status === 'Submitted')) {
          job.currentJobId = latestJob.id;
          job.isRunning = true;
        } else if (latestJob && (latestJob.status === 'Completed' || latestJob.status === 'Error' || latestJob.status === 'Stopped')) {
          job.isRunning = false;
        }
        this.cdr.markForCheck();
      }
    });
  }

  isJobRunning(job: BatchJobSummary): boolean {
    return !!(job.isRunning || job.lastJob?.status === 'Processing' || job.lastJob?.status === 'Submitted');
  }

  onExecute(jobName: string) {
    const jobSummary = this.batchJobs.find(j => j.name === jobName);
    if (jobSummary) {
      jobSummary.isRunning = true;
      jobSummary.currentJobId = null;
      this.cdr.markForCheck();
    }
    this.jobService.startJob(jobName).subscribe({
      next: (job) => {
        if (jobSummary) {
          jobSummary.currentJobId = job.id;
          jobSummary.lastJob = job;
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        const isConflict = err.status === 409 || err.error?.statusCode === 409 ||
          (err.error?.message && String(err.error.message).includes('already running'));

        if (isConflict) {
          this.toastService.showWarning(`Job '${jobName}' was already running. Monitoring the Job in progress.`);
          this.jobService.getLatestJob(jobName).subscribe(latestJob => {
            if (jobSummary && latestJob) {
              jobSummary.lastJob = latestJob;
              jobSummary.currentJobId = latestJob.id;
              jobSummary.isRunning = (latestJob.status === 'Processing' || latestJob.status === 'Submitted');
              this.cdr.markForCheck();
            }
          });
        } else {
          if (jobSummary) {
            jobSummary.isRunning = false;
          }
          const errorMsg = err.error?.message || err.message || String(err);
          this.toastService.showError(`Failed to start job ${jobName}: ${errorMsg}`, false);
          this.getLatestJob(jobName);
          this.cdr.markForCheck();
        }
      }
    });
  }

  onStop(jobSummary: BatchJobSummary) {
    const targetJobId = jobSummary.currentJobId || jobSummary.lastJob?.id || jobSummary.name;
    jobSummary.isStopping = true;
    this.cdr.markForCheck();
    this.jobService.stopJob(targetJobId).subscribe({
      next: (stoppedJob) => {
        jobSummary.isStopping = false;
        jobSummary.isRunning = false;
        jobSummary.lastJob = stoppedJob;
        this.toastService.showWarning(`Stop requested for job ${jobSummary.name}`);
        this.getSummary(jobSummary.name);
        this.cdr.markForCheck();
      },
      error: (err) => {
        jobSummary.isStopping = false;
        const errorMsg = err.error?.message || err.message || String(err);
        this.toastService.showError(`Failed to stop job ${jobSummary.name}: ${errorMsg}`, false);
        this.cdr.markForCheck();
      }
    });
  }

  onJobUpdated(jobSummary: BatchJobSummary, job: Job | null) {
    if (!job) return;
    const wasRunning = jobSummary.isRunning || jobSummary.isStopping;
    jobSummary.lastJob = job;
    if (job.status === 'Completed') {
      jobSummary.isRunning = false;
      jobSummary.isStopping = false;
      if (wasRunning) {
        this.toastService.showSuccess(`Job ${jobSummary.name} complete`);
        this.getSummary(jobSummary.name);
      }
    } else if (job.status === 'Stopped') {
      jobSummary.isRunning = false;
      jobSummary.isStopping = false;
      if (wasRunning) {
        this.toastService.showWarning(`Job ${jobSummary.name} stopped`);
        this.getSummary(jobSummary.name);
      }
    } else if (job.status === 'Error') {
      jobSummary.isRunning = false;
      jobSummary.isStopping = false;
      if (wasRunning) {
        this.toastService.showError(`Job ${jobSummary.name} error: ${job.status_message}`, false);
        this.getSummary(jobSummary.name);
      }
    } else if (job.status === 'Processing' || job.status === 'Submitted') {
      jobSummary.isRunning = true;
    }
    this.cdr.markForCheck();
  }

  formatDuration(durationInMs: number | undefined | null): string {
    if (durationInMs == null || isNaN(durationInMs)) {
      return '-';
    }
    if (durationInMs < 1000) {
      return durationInMs > 0 ? '< 1s' : '0s';
    }
    const totalSeconds = Math.round(durationInMs / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs.toString().padStart(2, '0')}s`;
    }
    return `${secs}s`;
  }

  formatResultSummary(resultSummary: string | undefined | null): string {
    if (!resultSummary) return '';
    try {
      const obj = JSON.parse(resultSummary);
      if (typeof obj === 'object' && obj !== null) {
        if (obj.updatedCount !== undefined && obj.totalCount !== undefined) {
          return `Updated ${obj.updatedCount} of ${obj.totalCount}`;
        }
        if (obj.convertedCount !== undefined && obj.totalCount !== undefined) {
          return `Converted ${obj.convertedCount} of ${obj.totalCount}`;
        }
        if (obj.remainingCount !== undefined) {
          return `Remaining: ${obj.remainingCount}`;
        }
        return JSON.stringify(obj);
      }
      return String(obj);
    } catch {
      return resultSummary;
    }
  }

  onCopyToClipboard(textToCopy: string) {
    navigator.clipboard.writeText(textToCopy).then(() => this.toastService.showSuccess(`Copied: ${textToCopy}`));
  }
}
