import {Inject, Injectable} from '@angular/core';
import {NgxPerfectStackConfig, STACK_CONFIG} from "../../ngx-perfect-stack-config";
import {HttpClient, HttpResponse} from "@angular/common/http";
import {DataImportClientMapping, DataImportModel} from "./upload-panel/data-import.model";
import {Job} from "../../job/job.model";
import {Observable, shareReplay} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class DataImportService {

  private dataImportClientMappingCache$: Observable<DataImportClientMapping[]>;

  constructor(
    @Inject(STACK_CONFIG)
    protected readonly stackConfig: NgxPerfectStackConfig,
    protected readonly http: HttpClient) { }

  getDataImportClientMapping(): Observable<DataImportClientMapping[]> {
    if (!this.dataImportClientMappingCache$) {
      this.dataImportClientMappingCache$ = this.http.get<DataImportClientMapping[]>(`${this.stackConfig.apiUrl}/data-import`).pipe(
        shareReplay(1)
      );
    }
    return this.dataImportClientMappingCache$;
  }

  checkSchema(formatKey: string, params: Record<string, any>): Observable<{ valid: boolean; errors: string[] }> {
    return this.http.get<{ valid: boolean; errors: string[] }>(
      `${this.stackConfig.apiUrl}/data-import/${encodeURIComponent(formatKey)}/schema-check`,
      { params }
    );
  }

  downloadTemplate(formatKey: string, params: Record<string, any>, flavour: 'grid' | 'dictionary'): Observable<HttpResponse<Blob>> {
    const queryParams: any = { ...params, flavour };
    return this.http.get(
      `${this.stackConfig.apiUrl}/data-import/${encodeURIComponent(formatKey)}/template`,
      { params: queryParams, responseType: 'blob', observe: 'response' }
    );
  }

  importData(dataImportModel: DataImportModel) {
    return this.http.post<Job>(`${this.stackConfig.apiUrl}/job/data-import/import`, dataImportModel);
  }

  searchJobs(criteria: {
    pageNumber?: number;
    pageSize?: number;
    status?: string[];
    textSearch?: string;
    jobNames?: string[];
    startDate?: string;
    endDate?: string;
  }): Observable<{ totalCount: number; pageNumber: number; pageSize: number; resultList: Job[] }> {
    let params: any = {};
    if (criteria.pageNumber) params.pageNumber = criteria.pageNumber.toString();
    if (criteria.pageSize) params.pageSize = criteria.pageSize.toString();
    if (criteria.status && criteria.status.length > 0) params.status = criteria.status.join(',');
    if (criteria.textSearch) params.textSearch = criteria.textSearch;
    if (criteria.jobNames && criteria.jobNames.length > 0) params.jobNames = criteria.jobNames.join(',');
    if (criteria.startDate) params.startDate = criteria.startDate;
    if (criteria.endDate) params.endDate = criteria.endDate;

    return this.http.get<{ totalCount: number; pageNumber: number; pageSize: number; resultList: Job[] }>(
      `${this.stackConfig.apiUrl}/job/data-import/search`,
      { params }
    );
  }

  rollbackJob(jobId: string): Observable<{ success: boolean; deletedCount: number; message: string; jobId: string; status: string }> {
    return this.http.post<{ success: boolean; deletedCount: number; message: string; jobId: string; status: string }>(
      `${this.stackConfig.apiUrl}/job/data-import/rollback/${jobId}`,
      {}
    );
  }

  acceptJob(jobId: string): Observable<{ success: boolean; jobId: string; reviewStatus: string; message: string; acceptedCount?: number }> {
    return this.http.post<{ success: boolean; jobId: string; reviewStatus: string; message: string; acceptedCount?: number }>(
      `${this.stackConfig.apiUrl}/job/data-import/accept/${jobId}`,
      {}
    );
  }
}
