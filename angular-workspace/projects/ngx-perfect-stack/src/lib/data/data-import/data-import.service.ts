import {Inject, Injectable} from '@angular/core';
import {NgxPerfectStackConfig, STACK_CONFIG} from "../../ngx-perfect-stack-config";
import {HttpClient} from "@angular/common/http";
import {DataImportModel} from "./upload-panel/data-import.model";
import {Job} from "../../job/job.model";

@Injectable({
  providedIn: 'root'
})
export class DataImportService {

  constructor(
    @Inject(STACK_CONFIG)
    protected readonly stackConfig: NgxPerfectStackConfig,
    protected readonly http: HttpClient) { }


  importData( dataImportModel: DataImportModel) {
    return this.http.post<Job>(`${this.stackConfig.apiUrl}/job/data-import/import`, dataImportModel);
  }


}
