import {Component, effect, Injector, OnInit, viewChild} from '@angular/core';
import {UploadPanelComponent} from "./upload-panel/upload-panel.component";
import {FormArray, FormControl, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {DataImportModel} from "./upload-panel/data-import.model";
import {NgbTooltip} from "@ng-bootstrap/ng-bootstrap";
import {DataImportService} from "./data-import.service";
import {ActivatedRoute, RouterLink} from "@angular/router";
import {JobProgressMonitorComponent} from "../../job/job-progress-monitor/job-progress-monitor.component";
import {Job} from "../../job/job.model";
import {Location} from '@angular/common';
import {JobService} from "../../job/job.service";

@Component({
  selector: 'lib-data-import',
  imports: [
    UploadPanelComponent,
    ReactiveFormsModule,
    NgbTooltip,
    RouterLink,
    JobProgressMonitorComponent
  ],
  templateUrl: './data-import.component.html',
  styleUrl: './data-import.component.css'
})
export class DataImportComponent implements OnInit {

  uploadPanel = viewChild(UploadPanelComponent);

  job: Job | null;
  data: DataImportModel | null;
  form: FormArray;

  phase: null | 'validating' | 'importing' = null;

  jobIdValidate: string | null;
  jobIdImport: string | null;

  importStarted = false;

  constructor(
    protected readonly dataImportService: DataImportService,
    protected readonly jobService: JobService,
    private route: ActivatedRoute,
    private location: Location,
    private injector: Injector) {
    effect(() => {
      const  uploadPanel = this.uploadPanel();
      if(uploadPanel) {
        this.data = null;
        this.importStarted = false;

        const  uploadedData = uploadPanel.uploadedData();
        console.log('Data Import: uploadedData:', uploadedData);
        if(uploadedData) {
          this.job = uploadedData as Job;
          this.jobIdValidate = this.job.id;
          this.phase = 'validating';

          console.log('Data Import: user uploaded file for job:', this.job);

          // We want to add the jobId and phase to the URL so that if the user refreshes the page,
          // the job progress monitor can pick up the job and continue monitoring it.
          this.location.replaceState(`/data/import?jobId=${this.job.id}&phase=validating`);
        }
      }
    }, {injector: this.injector});
  }

  ngOnInit(): void {
    // Initialise the component with the current status of the job taken from the parameters in the URL. This allows
    // the user to hit refresh on a job after their component has been asleep.
    this.route.queryParams.subscribe(params => {
      const jobId = params['jobId'];
      this.phase = params['phase'];

      switch (this.phase) {
        case 'validating':
          this.jobIdValidate = jobId;
          break;
        case 'importing':
          this.jobIdImport = jobId;
          break;
        default:
          this.jobIdValidate = null;
          this.jobIdImport = null;
      }

      if(jobId) {
        this.jobService.getJob(jobId).subscribe(job => {
          this.onJobUpdated(job);
        });
      }
    });
  }

  private createForm(data: DataImportModel) {
    this.form = new FormArray<FormGroup>([]);
    const dataRows = data.dataRows;
    for (let rowIdx = 0; rowIdx < dataRows.length; rowIdx++) {
      const rowGroup = new FormGroup({});
      this.form.push(rowGroup);

      const rowData = dataRows[rowIdx] || [];
      for(let colIdx = 0; colIdx < rowData.length; colIdx++) {
        const initialValue = rowData[colIdx] || '';
        rowGroup.addControl(`col-${colIdx}`, new FormControl(initialValue));
      }
    }
  }

  get headers(): string[] | null {
    if(this.data && this.data.headers) {
      return this.data.headers;
    }
    return null;
  }

  get formRows(): FormGroup[] {
    return this.form && this.form.controls ? this.form.controls as FormGroup[] : [];
  }

  formControls(formGroup: FormGroup): FormControl[] {
    return Object.values(formGroup.controls) as FormControl[];
  }

  isRowSkipped(rowIdx: number) {
    return this.data && this.data.skipRows && (this.data.skipRows[rowIdx] === 'Blank' || this.data.skipRows[rowIdx] === 'Duplicate');
  }

  isRowSkippedToolTip(rowIdx: number): string {
    if(this.isRowSkipped(rowIdx)) {
      const skipReason = this.data?.skipRows[rowIdx];
      switch (skipReason) {
        case 'Blank':
          return 'Row skipped due to blank fields';
        case 'Duplicate':
          return 'Row skipped due to duplicate earlier in file';
        default:
          throw new Error(`Unhandled skip reason - ${skipReason}`);
      }
    }
    return '';
  }

  importHasErrors() {
    return this.data && this.data.errors && this.data.errors.length > 0;
  }

  findErrors(rowIdx: number, colIdx: number) {
    const errors = [];
    if(this.data && this.data.errors) {
      for(const nextError of this.data.errors) {
        if(nextError.row === rowIdx && nextError.cols.includes(colIdx)) {
          errors.push(nextError);
        }
      }
    }

    return errors.length > 0 ? errors : null;
  }

  findErrorMessages(rowIdx: number, colIdx: number): string[] {
    const errors = this.findErrors(rowIdx, colIdx);
    if(errors && errors.length > 0) {
      return errors.map(nextError => nextError.message);
    }
    return [];
  }

  findErrorMessagesAsTooltip(rowIdx: number, colIdx: number): string {
    const errorMessages = this.findErrorMessages(rowIdx, colIdx);
    return errorMessages && errorMessages.length > 0 ? errorMessages.join(' ') : '';
  }

  onImportData() {
    if(this.data && this.data.errors.length === 0) {
      this.importStarted = true;
      this.dataImportService.importData(this.data).subscribe(result => {
        console.log('Data Import: got result:', result);
        this.jobIdImport = result.id;
        this.phase = 'importing';
        this.location.replaceState(`/data/import?jobId=${result.id}&phase=importing`);
        this.data = JSON.parse(result.data) as DataImportModel;
      });
    }
  }

  onJobUpdated(job: Job | null) {

    if(job) {
      if (job.data && !this.data) {
        this.job = job;
        this.data = JSON.parse(job.data) as DataImportModel;
        this.createForm(this.data);
      }

      if (job.status === 'Completed') {
        this.job = job;
        this.data = JSON.parse(job.data) as DataImportModel;
        this.createForm(this.data);
      }

      // A bit of a hack to update the row counts without updating the form (which would cause a big impact on the UI)
      if(job.data) {
        const dataProgress = JSON.parse(job.data) as DataImportModel;
        if(this.data) {
          this.data.skipRowCount = dataProgress.skipRowCount;
          this.data.errorRowCount = dataProgress.errorRowCount;
          this.data.validRowCount = dataProgress.validRowCount;
          this.data.totalRowCount = dataProgress.totalRowCount;
        }
      }

      console.log(`Data Import: job updated - job:`, this.job);
      console.log(`Data Import: job updated - data:`, this.data);
    }
  }
}
