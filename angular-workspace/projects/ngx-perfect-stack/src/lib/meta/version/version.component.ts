import {Component, Inject, Input, OnInit} from '@angular/core';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../../ngx-perfect-stack-config';
import { HttpClient } from '@angular/common/http';
import {DebugService} from '../../utils/debug/debug.service';
import {ToastService} from '../../utils/toasts/toast.service';
import {CoordinateConverterService} from './coordinate-converter.service';
import {BatchService} from "./batch.service";

@Component({
    selector: 'lib-version',
    templateUrl: './version.component.html',
    styleUrls: ['./version.component.css'],
    standalone: false
})
export class VersionComponent implements OnInit {

  clientVersion = '';
  serverVersion = '';

  @Input()
  style: 'Page' | 'Footer' = 'Page';

  conversionRemainingCount = -1;
  ageClassSummary: any;


  copyrightFooter: string;
  supportEmail: string;

  constructor(@Inject(STACK_CONFIG)
              protected readonly stackConfig: NgxPerfectStackConfig,
              public readonly debugService: DebugService,
              protected readonly coordinateConverterService: CoordinateConverterService,
              protected readonly batchService: BatchService,
              protected readonly toastService: ToastService,
              protected readonly http: HttpClient) { }

  ngOnInit(): void {
    this.clientVersion = this.stackConfig.clientRelease;

    this.http.get(`${this.stackConfig.apiUrl}/meta/menu/version`).subscribe((a: any) => {
      this.serverVersion = a.serverRelease;
    });

    this.getSummaryAgeClass();
    this.getSummaryCoordinates();

    this.copyrightFooter = this.stackConfig.copyrightFooter;
    this.supportEmail = this.stackConfig.supportEmail;
  }

  onToggleDebug() {
    this.debugService.toggleDebug();
  }

  onMigrateData() {
    this.http.post(`${this.stackConfig.apiUrl}/migrate/data`, null).subscribe((a: any) => {
      this.toastService.showSuccess('Migrate Data complete');
    });
  }

  onMigrateImages() {
    this.http.post(`${this.stackConfig.apiUrl}/migrate/images`, null).subscribe((a: any) => {
      this.toastService.showSuccess('Migrate Images complete');
    });
  }

  onMigrateImagesReset() {
    this.http.post(`${this.stackConfig.apiUrl}/migrate/images/reset`, null).subscribe((a: any) => {
      this.toastService.showSuccess('Images RESET complete');
    });
  }

  getSummaryAgeClass() {
    this.batchService.ageClassSummary().subscribe(summary => {
      this.ageClassSummary = summary;
    });
  }

  onUpdateAgeClass() {
    this.batchService.ageClassUpdate().subscribe(() => {
      this.toastService.showSuccess('Batch job complete');
      this.getSummaryAgeClass();
    });
  }

  getSummaryCoordinates() {
    this.coordinateConverterService.getSummary().subscribe((summary: any) => {
      this.conversionRemainingCount = summary.remainingCount;
    });
  }

  onConvertCoordinates() {
    this.coordinateConverterService.convert().subscribe((summary: any) => {
      this.conversionRemainingCount = summary.remainingCount;
    });
  }

}
