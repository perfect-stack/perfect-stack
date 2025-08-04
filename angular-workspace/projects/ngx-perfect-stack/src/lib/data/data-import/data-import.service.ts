import {Inject, Injectable} from '@angular/core';
import {NgxPerfectStackConfig, STACK_CONFIG} from "../../ngx-perfect-stack-config";
import {HttpClient} from "@angular/common/http";
import {DataImportModel, DataImportResult} from "./upload-panel/data-import.model";

@Injectable({
  providedIn: 'root'
})
export class DataImportService {

  constructor(
    @Inject(STACK_CONFIG)
    protected readonly stackConfig: NgxPerfectStackConfig,
    protected readonly http: HttpClient) { }


  importData( dataImportModel: DataImportModel) {
    return this.http.post<DataImportResult>(`${this.stackConfig.apiUrl}/data-import/data`, dataImportModel);
  }


}
