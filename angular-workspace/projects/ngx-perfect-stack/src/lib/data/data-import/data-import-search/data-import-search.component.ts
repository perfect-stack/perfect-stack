import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DataImportService } from '../data-import.service';
import { Job } from '../../../job/job.model';

@Component({
  selector: 'lib-data-import-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    DatePipe
  ],
  templateUrl: './data-import-search.component.html',
  styleUrls: ['./data-import-search.component.css']
})
export class DataImportSearchComponent implements OnInit {

  jobs: Job[] = [];
  loading = false;
  errorMessage = '';

  // Search Criteria
  textSearch = '';
  includeValidating = false;

  availableStatuses: { label: string; value: string; color: string }[] = [
    { label: 'Completed', value: 'Completed', color: 'bg-success' },
    { label: 'Error', value: 'Error', color: 'bg-danger' },
    { label: 'Processing', value: 'Processing', color: 'bg-primary' },
    { label: 'Submitted', value: 'Submitted', color: 'bg-info text-dark' },
    { label: 'RolledBack', value: 'RolledBack', color: 'bg-secondary' },
    { label: 'Stopped', value: 'Stopped', color: 'bg-warning text-dark' },
  ];

  selectedStatuses: Set<string> = new Set(['Completed', 'Error', 'Processing', 'Submitted', 'RolledBack']);

  // Pagination
  pageNumber = 1;
  pageSize = 25;
  totalCount = 0;

  // Rollback confirmation modal state
  rollbackTargetJob: Job | null = null;
  rollbackInProgress = false;
  rollbackError = '';

  constructor(
    protected readonly dataImportService: DataImportService,
    protected readonly router: Router,
    protected readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.executeSearch();
  }

  isStatusSelected(status: string): boolean {
    return this.selectedStatuses.has(status);
  }

  toggleStatus(status: string): void {
    if (this.selectedStatuses.has(status)) {
      this.selectedStatuses.delete(status);
    } else {
      this.selectedStatuses.add(status);
    }
    this.pageNumber = 1;
    this.executeSearch();
  }

  toggleSelectAllStatuses(): void {
    if (this.selectedStatuses.size === this.availableStatuses.length) {
      this.selectedStatuses.clear();
    } else {
      this.availableStatuses.forEach(s => this.selectedStatuses.add(s.value));
    }
    this.pageNumber = 1;
    this.executeSearch();
  }

  onIncludeValidatingChanged(): void {
    this.pageNumber = 1;
    this.executeSearch();
  }

  onSearchSubmit(): void {
    this.pageNumber = 1;
    this.executeSearch();
  }

  onResetFilters(): void {
    this.textSearch = '';
    this.includeValidating = false;
    this.selectedStatuses = new Set(['Completed', 'Error', 'Processing', 'Submitted', 'RolledBack']);
    this.pageNumber = 1;
    this.pageSize = 25;
    this.executeSearch();
  }

  executeSearch(): void {
    this.loading = true;
    this.errorMessage = '';

    const jobNames = this.includeValidating
      ? ['Data Import - Import', 'Data Import - Validate']
      : ['Data Import - Import'];

    const statusList = Array.from(this.selectedStatuses);

    this.dataImportService.searchJobs({
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      status: statusList.length > 0 ? statusList : undefined,
      textSearch: this.textSearch ? this.textSearch.trim() : undefined,
      jobNames: jobNames
    }).subscribe({
      next: (response) => {
        this.jobs = response.resultList || [];
        this.totalCount = response.totalCount || 0;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || err?.message || 'Failed to search data import jobs';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize) || 1;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.pageNumber) {
      this.pageNumber = page;
      this.executeSearch();
    }
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize = newSize;
    this.pageNumber = 1;
    this.executeSearch();
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Completed':
        return 'badge bg-success';
      case 'Error':
        return 'badge bg-danger';
      case 'Processing':
        return 'badge bg-primary';
      case 'Submitted':
        return 'badge bg-info text-dark';
      case 'RolledBack':
        return 'badge bg-secondary';
      case 'Stopped':
        return 'badge bg-warning text-dark';
      default:
        return 'badge bg-light text-dark border';
    }
  }

  viewJob(job: Job): void {
    const isImport = job.name.includes('Import');
    const phase = isImport ? 'importing' : 'validating';
    this.router.navigate(['/data/import'], {
      queryParams: {
        jobId: job.id,
        phase: phase
      }
    });
  }

  canRollback(job: Job): boolean {
    return job.name === 'Data Import - Import' &&
      job.status === 'Completed' &&
      (job.imported_count === undefined || job.imported_count > 0);
  }

  openRollbackModal(job: Job): void {
    this.rollbackTargetJob = job;
    this.rollbackError = '';
    this.rollbackInProgress = false;
  }

  closeRollbackModal(): void {
    this.rollbackTargetJob = null;
    this.rollbackError = '';
    this.rollbackInProgress = false;
  }

  confirmRollback(): void {
    if (!this.rollbackTargetJob) return;

    this.rollbackInProgress = true;
    this.rollbackError = '';

    this.dataImportService.rollbackJob(this.rollbackTargetJob.id).subscribe({
      next: (res) => {
        this.rollbackInProgress = false;
        this.closeRollbackModal();
        this.executeSearch();
      },
      error: (err) => {
        this.rollbackInProgress = false;
        this.rollbackError = err?.error?.message || err?.message || 'Failed to rollback import';
        this.cdr.markForCheck();
      }
    });
  }
}
