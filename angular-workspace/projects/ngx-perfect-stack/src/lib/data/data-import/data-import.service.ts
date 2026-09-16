import {Inject, Injectable} from '@angular/core';
import {NgxPerfectStackConfig, STACK_CONFIG} from "../../ngx-perfect-stack-config";
import {HttpClient} from "@angular/common/http";
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

  importData(dataImportModel: DataImportModel) {
    return this.http.post<Job>(`${this.stackConfig.apiUrl}/job/data-import/import`, dataImportModel);
  }
}
