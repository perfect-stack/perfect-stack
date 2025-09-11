import {Component, Inject} from '@angular/core';
import {CommonModule, NgIf} from "@angular/common";
import {NgxPerfectStackConfig, STACK_CONFIG} from "../../ngx-perfect-stack-config";
import {BatchService} from "./batch.service";
import {ToastService} from "../../utils/toasts/toast.service";

@Component({
  selector: 'lib-batch',
    imports: [
        NgIf,
        CommonModule
    ],
  templateUrl: './batch.component.html',
  styleUrl: './batch.component.css'
})
export class BatchComponent {

  ageClassSummary: any;
  conversionRemainingCount = -1;
  dbSnapshotSummary: any;


  constructor(@Inject(STACK_CONFIG)
              protected readonly stackConfig: NgxPerfectStackConfig,
              protected readonly batchService: BatchService,
              protected readonly toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.getSummaryAgeClass();
    this.getSummaryCoordinates();
    this.getSummaryDbSnapshot();
  }

  getSummaryAgeClass() {
    this.batchService.getSummary("age_class").subscribe(summary => {
      this.ageClassSummary = summary;
    });
  }

  getSummaryCoordinates() {
    this.batchService.getSummary("coordinate_converter").subscribe((summary: any) => {
      this.conversionRemainingCount = summary.remainingCount;
    });
  }

  getSummaryDbSnapshot() {
    this.batchService.getSummary("db_snapshot").subscribe((summary: any) => {
      this.dbSnapshotSummary = summary;
    });
  }

  onUpdateAgeClass() {
    this.batchService.execute('age_class').subscribe(() => {
      this.toastService.showSuccess('Batch job complete');
      this.getSummaryAgeClass();
    });
  }

  onConvertCoordinates() {
    this.batchService.execute('coordinate_converter').subscribe((summary: any) => {
      this.conversionRemainingCount = summary.remainingCount;
      this.toastService.showSuccess('Batch job complete');
      this.getSummaryAgeClass();
    });
  }

  onDbSnapshot() {
    this.batchService.execute('db_snapshot').subscribe(() => {
      this.toastService.showSuccess('Batch job complete');
      this.getSummaryDbSnapshot();
    });
  }


  onCopyToClipboard(textToCopy: string) {
    navigator.clipboard.writeText(textToCopy).then(() => this.toastService.showSuccess(`Copied: ${textToCopy}`));
  }
}
