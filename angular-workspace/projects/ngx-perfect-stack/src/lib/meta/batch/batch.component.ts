import {Component, Inject, OnInit} from '@angular/core';
import {CommonModule, NgIf} from "@angular/common";
import {NgxPerfectStackConfig, STACK_CONFIG} from "../../ngx-perfect-stack-config";
import {BatchService} from "./batch.service";
import {ToastService} from "../../utils/toasts/toast.service";

interface BatchJobSummary {
  name: string;
  summary: any;
}

@Component({
  selector: 'lib-batch',
    imports: [
        NgIf,
        CommonModule
    ],
  templateUrl: './batch.component.html',
  styleUrl: './batch.component.css'
})
export class BatchComponent implements OnInit {

  batchJobs: BatchJobSummary[] = [];

  constructor(@Inject(STACK_CONFIG)
              protected readonly stackConfig: NgxPerfectStackConfig,
              protected readonly batchService: BatchService,
              protected readonly toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.batchService.getList().subscribe(jobs => {
      this.batchJobs = jobs.map(name => ({ name, summary: null }));
      this.batchJobs.forEach(job => this.getSummary(job.name));
    });
  }

  getSummary(jobName: string) {
    this.batchService.getSummary(jobName).subscribe(summary => {
      const job = this.batchJobs.find(j => j.name === jobName);
      if (job) {
        job.summary = summary;
      }
    });
  }

  onExecute(jobName: string) {
    this.batchService.execute(jobName).subscribe(() => {
      this.toastService.showSuccess(`Batch job ${jobName} complete`);
      this.getSummary(jobName);
    });
  }

  onCopyToClipboard(textToCopy: string) {
    navigator.clipboard.writeText(textToCopy).then(() => this.toastService.showSuccess(`Copied: ${textToCopy}`));
  }
}
