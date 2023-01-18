import {Component, Inject, Input, OnInit} from '@angular/core';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../../ngx-perfect-stack-config';
import {HttpClient} from '@angular/common/http';
import {DebugService} from '../../utils/debug/debug.service';
import {ToastService} from '../../utils/toasts/toast.service';
import {CoordinateConverterService} from './coordinate-converter.service';

@Component({
  selector: 'lib-version',
  templateUrl: './version.component.html',
  styleUrls: ['./version.component.css']
})
export class VersionComponent implements OnInit {

  clientVersion = '';
  serverVersion = '';

  @Input()
  style: 'Page' | 'Footer' = 'Page';

  conversionRemainingCount = -1;

  copyrightFooter: string;
  supportEmail: string;

  constructor(@Inject(STACK_CONFIG)
              protected readonly stackConfig: NgxPerfectStackConfig,
              public readonly debugService: DebugService,
              protected readonly coordinateConverterService: CoordinateConverterService,
              protected readonly toastService: ToastService,
              protected readonly http: HttpClient) { }

  ngOnInit(): void {
    this.clientVersion = this.stackConfig.clientRelease;

    this.http.get(`${this.stackConfig.apiUrl}/meta/menu/version`).subscribe((a: any) => {
      this.serverVersion = a.serverRelease;
    });

    this.coordinateConverterService.getSummary().subscribe((summary: any) => {
      this.conversionRemainingCount = summary.remainingCount;
    });

    this.copyrightFooter = this.stackConfig.copyrightFooter;
    this.supportEmail = this.stackConfig.supportEmail;
  }

  onToggleDebug() {
    this.debugService.toggleDebug();
  }

  onToastSuccess() {
    this.toastService.showSuccess('This is a success message');
  }

  onToastWarning() {
    this.toastService.showWarning('This is a warning message');
  }

  onToastError() {
    this.toastService.showError('This is a error message', false);
  }

  onConvert() {
    console.log('Convert now');
    this.coordinateConverterService.convert().subscribe((summary: any) => {
      this.conversionRemainingCount = summary.remainingCount;
    });
  }
}
