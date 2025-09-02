import {Component, Inject} from '@angular/core';
import {NgIf} from "@angular/common";
import {NgxPerfectStackConfig, STACK_CONFIG} from "../../ngx-perfect-stack-config";
import {BatchService} from "./batch.service";
import {ToastService} from "../../utils/toasts/toast.service";

@Component({
  selector: 'lib-batch',
    imports: [
        NgIf
    ],
  templateUrl: './batch.component.html',
  styleUrl: './batch.component.css'
})
export class BatchComponent {

  conversionRemainingCount = -1;
  ageClassSummary: any;

  constructor(@Inject(STACK_CONFIG)
              protected readonly stackConfig: NgxPerfectStackConfig,
              protected readonly batchService: BatchService,
              protected readonly toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.getSummaryAgeClass();
    this.getSummaryCoordinates();
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

}
