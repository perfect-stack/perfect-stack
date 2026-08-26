import {Component, effect, Injector, OnDestroy, OnInit, viewChild} from '@angular/core';
import {UploadPanelComponent} from "./upload-panel/upload-panel.component";
import {FormArray, FormControl, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {DataImportModel, DataImportSkippedColumn} from "./upload-panel/data-import.model";
import {NgbTooltip} from "@ng-bootstrap/ng-bootstrap";
import {DataImportService} from "./data-import.service";
import {ActivatedRoute, RouterLink} from "@angular/router";
import {JobProgressMonitorComponent} from "../../job/job-progress-monitor/job-progress-monitor.component";
import {Job} from "../../job/job.model";
import {Location, NgClass} from '@angular/common';
import {JobService} from "../../job/job.service";

@Component({
  selector: 'lib-data-import',
  imports: [
    UploadPanelComponent,
    ReactiveFormsModule,
    NgbTooltip,
    RouterLink,
    JobProgressMonitorComponent,
    NgClass
  ],
  templateUrl: './data-import.component.html',
  styleUrl: './data-import.component.css'
})
export class DataImportComponent implements OnInit, OnDestroy {

  uploadPanel = viewChild(UploadPanelComponent);

  job: Job | null;
  data: DataImportModel | null;
  form: FormArray;

  phase: null | 'validating' | 'importing' = null;

  jobIdValidate: string | null;
  jobIdImport: string | null;

  importStarted = false;

  private activeTooltip: NgbTooltip | null = null;
  private tooltipCloseTimeout: any = null;

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

  ngOnDestroy(): void {
    this.cancelCloseTooltip();
    if (this.activeTooltip && this.activeTooltip.isOpen()) {
      this.activeTooltip.close();
    }
  }

  openTooltip(tooltip: NgbTooltip) {
    this.cancelCloseTooltip();
    if (this.activeTooltip && this.activeTooltip !== tooltip && this.activeTooltip.isOpen()) {
      this.activeTooltip.close();
    }
    this.activeTooltip = tooltip;
    if (!tooltip.isOpen()) {
      tooltip.open();
    }
  }

  cancelCloseTooltip() {
    if (this.tooltipCloseTimeout) {
      clearTimeout(this.tooltipCloseTimeout);
      this.tooltipCloseTimeout = null;
    }
  }

  scheduleCloseTooltip(tooltip: NgbTooltip, delayMs = 300) {
    this.cancelCloseTooltip();
    this.tooltipCloseTimeout = setTimeout(() => {
      if (tooltip.isOpen()) {
        tooltip.close();
      }
      if (this.activeTooltip === tooltip) {
        this.activeTooltip = null;
      }
      this.tooltipCloseTimeout = null;
    }, delayMs);
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
    return !!this.data?.importResult?.[rowIdx]?.skipFlag;
  }

  isRowSkippedToolTip(rowIdx: number): string {
    if(this.isRowSkipped(rowIdx)) {
      const rowResult = this.data?.importResult?.[rowIdx];
      const skipReason = rowResult?.skipReason;
      switch (skipReason) {
        case 'Blank':
          return 'Row skipped due to blank fields';
        case 'Duplicate':
          return rowResult?.duplicateReason || 'Row skipped due to duplicate earlier in file';
        default:
          throw new Error(`Unhandled skip reason - ${skipReason}`);
      }
    }
    return '';
  }

  getRowProposedEntityJson(rowIdx: number): string | null {
    const proposed = this.data?.importResult?.[rowIdx]?.proposedEntity;
    return proposed ? JSON.stringify(proposed, null, 2) : null;
  }

  getRowActualEntityJson(rowIdx: number): string | null {
    const actual = this.data?.importResult?.[rowIdx]?.actualEntity;
    return actual ? JSON.stringify(actual, null, 2) : null;
  }

  get totalRowCount(): number {
    return this.data?.dataRows?.length ?? 0;
  }

  get skipRowCount(): number {
    if (!this.data?.importResult) return 0;
    return this.data.importResult.filter(r => r && (r.skipFlag || r.skipReason === 'Blank' || r.skipReason === 'Duplicate')).length;
  }

  get errorRowCount(): number {
    if (!this.data?.importResult) return 0;
    return this.data.importResult.filter(r => r && !r.skipFlag && r.errors && r.errors.length > 0).length;
  }

  get validRowCount(): number {
    if (!this.data?.importResult) return 0;
    return this.data.importResult.filter(r => r && !r.skipFlag && (!r.errors || r.errors.length === 0)).length;
  }

  get importedRowCount(): number {
    if (!this.data?.importResult) return 0;
    return this.data.importResult.filter(r => r && !!r.actualEntity).length;
  }

  get unprocessedRowCount(): number {
    const total = this.totalRowCount;
    const processed = this.data?.importResult?.length ?? 0;
    return Math.max(0, total - processed);
  }

  getRowResultSummary(rowIdx: number): 'Imported' | 'Duplicate' | 'Error' | 'Skipped' | 'Valid' | 'Unprocessed' | '' {
    if (!this.data) {
      return '';
    }

    const rowResult = this.data?.importResult?.[rowIdx];
    if (!rowResult) {
      return 'Unprocessed';
    }

    if (rowResult.actualEntity) {
      return 'Imported';
    }

    if (rowResult.skipReason === 'Duplicate' || rowResult.duplicateReason) {
      return 'Duplicate';
    }

    if (rowResult.skipFlag || rowResult.skipReason === 'Blank') {
      return 'Skipped';
    }

    if (rowResult.errors && rowResult.errors.length > 0) {
      return 'Error';
    }

    return 'Valid';
  }

  getRowResultBadgeClass(rowIdx: number): string {
    const summary = this.getRowResultSummary(rowIdx);
    switch (summary) {
      case 'Imported':
        return 'bg-success text-white';
      case 'Valid':
        return 'bg-primary text-white';
      case 'Error':
        return 'bg-danger text-white';
      case 'Duplicate':
        return 'bg-warning text-dark';
      case 'Skipped':
        return 'bg-secondary text-white';
      case 'Unprocessed':
        return 'bg-light text-muted border';
      default:
        return 'bg-light text-dark';
    }
  }

  hasRowTooltip(rowIdx: number): boolean {
    return !!this.getRowResultSummary(rowIdx);
  }

  findSkippedColumn(rowIdx: number, colIdx: number): DataImportSkippedColumn | null {
    const rowResult = this.data?.importResult?.[rowIdx];
    if (rowResult && rowResult.skippedColumns) {
      return rowResult.skippedColumns.find(sc => sc.col === colIdx) || null;
    }
    return null;
  }

  isCellSkipped(rowIdx: number, colIdx: number): boolean {
    if (this.isRowSkipped(rowIdx)) {
      return true;
    }
    return !!this.findSkippedColumn(rowIdx, colIdx);
  }

  isCellSkippedToolTip(rowIdx: number, colIdx: number): string {
    if (this.isRowSkipped(rowIdx)) {
      return this.isRowSkippedToolTip(rowIdx);
    }
    const skippedCol = this.findSkippedColumn(rowIdx, colIdx);
    if (skippedCol) {
      return skippedCol.reason || 'Column skipped (not part of data format)';
    }
    return '';
  }

  importHasErrors(): boolean {
    return this.errorRowCount > 0;
  }

  findErrors(rowIdx: number, colIdx: number) {
    const errors = [];
    const rowErrors = this.data?.importResult?.[rowIdx]?.errors;
    if (rowErrors) {
      for (const nextError of rowErrors) {
        if (nextError.cols && nextError.cols.includes(colIdx)) {
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
    if(this.data && !this.importHasErrors()) {
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
      this.job = job;

      if (job.data) {
        const dataProgress = JSON.parse(job.data) as DataImportModel;
        if (!this.data || !this.form) {
          this.data = dataProgress;
          this.createForm(this.data);
        } else {
          this.data = dataProgress;
        }
      }

      console.log(`Data Import: job updated - job:`, this.job);
      console.log(`Data Import: job updated - data:`, this.data);
    }
  }
}
