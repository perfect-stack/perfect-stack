import {Component, Inject, OnInit} from '@angular/core';
import {CommonModule, NgIf} from "@angular/common";
import {NgxPerfectStackConfig, STACK_CONFIG} from "../../ngx-perfect-stack-config";
import {BatchService} from "./batch.service";
import {ToastService} from "../../utils/toasts/toast.service";
import {JobService} from "../../job/job.service";
import {JobProgressMonitorComponent} from "../../job/job-progress-monitor/job-progress-monitor.component";
import {Job} from "../../job/job.model";

interface BatchJobSummary {
  name: string;
  summary: any;
  currentJobId?: string | null;
  isRunning?: boolean;
}

@Component({
  selector: 'lib-batch',
  imports: [
    NgIf,
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
              protected readonly toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.jobService.getJobList().subscribe(jobs => {
      this.batchJobs = jobs.map(name => ({ name, summary: null, currentJobId: null, isRunning: false }));
      this.batchJobs.forEach(job => this.getSummary(job.name));
    });
  }

  getSummary(jobName: string) {
    this.jobService.getJobSummary(jobName).subscribe(summary => {
      const job = this.batchJobs.find(j => j.name === jobName);
      if (job) {
        job.summary = summary;
      }
    });
  }

  onExecute(jobName: string) {
    const jobSummary = this.batchJobs.find(j => j.name === jobName);
    if (jobSummary) {
      jobSummary.isRunning = true;
      jobSummary.currentJobId = null;
    }
    this.jobService.startJob(jobName).subscribe({
      next: (job) => {
        if (jobSummary) {
          jobSummary.currentJobId = job.id;
        }
      },
      error: (err) => {
        if (jobSummary) {
          jobSummary.isRunning = false;
        }
        this.toastService.showError(`Failed to start job ${jobName}: ${err.message ?? err}`, false);
      }
    });
  }

  onJobUpdated(jobSummary: BatchJobSummary, job: Job | null) {
    if (!job) return;
    if (job.status === 'Completed') {
      jobSummary.isRunning = false;
      this.toastService.showSuccess(`Job ${jobSummary.name} complete`);
      this.getSummary(jobSummary.name);
    } else if (job.status === 'Error') {
      jobSummary.isRunning = false;
      this.toastService.showError(`Job ${jobSummary.name} error: ${job.status_message}`, false);
      this.getSummary(jobSummary.name);
    }
  }

  onCopyToClipboard(textToCopy: string) {
    navigator.clipboard.writeText(textToCopy).then(() => this.toastService.showSuccess(`Copied: ${textToCopy}`));
  }
}
