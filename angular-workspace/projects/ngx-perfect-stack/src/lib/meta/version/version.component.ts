import {ChangeDetectorRef, Component, Inject, Input, OnInit} from '@angular/core';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../../ngx-perfect-stack-config';
import { HttpClient } from '@angular/common/http';
import {DebugService} from '../../utils/debug/debug.service';
import {ToastService} from '../../utils/toasts/toast.service';
import {BatchService} from "../batch/batch.service";
import {MetaMenuService} from '../menu/meta-menu-service/meta-menu.service';

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

  copyrightFooter: string;
  supportEmail: string;

  postGisStatus: 'idle' | 'loading' | 'success' | 'error' = 'idle';
  postGisAction = '';
  postGisResult: any = null;
  postGisResultText = '';
  postGisError = '';

  constructor(@Inject(STACK_CONFIG)
              protected readonly stackConfig: NgxPerfectStackConfig,
              public readonly debugService: DebugService,
              protected readonly batchService: BatchService,
              protected readonly toastService: ToastService,
              protected readonly metaMenuService: MetaMenuService,
              protected readonly http: HttpClient,
              protected readonly cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.clientVersion = this.stackConfig.clientRelease;

    this.http.get(`${this.stackConfig.apiUrl}/meta/menu/version`).subscribe((a: any) => {
      this.serverVersion = a.serverRelease;
      this.cdr.markForCheck();
    });

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

  getPostGisVersion() {
    this.onGetPostGisVersion();
  }

  createPostGisExtension() {
    this.onCreatePostGisExtension();
  }

  onGetPostGisVersion() {
    this.postGisStatus = 'loading';
    this.postGisAction = 'Get PostGIS Version';
    this.postGisError = '';
    this.postGisResult = null;
    this.postGisResultText = '';

    this.metaMenuService.getPostGisVersion().subscribe({
      next: (result: any) => {
        this.postGisStatus = 'success';
        this.postGisResult = result;
        this.postGisResultText = this.formatPostGisResult(result);
        this.toastService.showSuccess('PostGIS version query complete');
        this.cdr.markForCheck();
      },
      error: (error: any) => {
        this.postGisStatus = 'error';
        this.postGisError = error?.error?.message || error?.message || 'Failed to get PostGIS version';
        this.toastService.showError(this.postGisError, false);
        this.cdr.markForCheck();
      }
    });
  }

  onCreatePostGisExtension() {
    this.postGisStatus = 'loading';
    this.postGisAction = 'Create PostGIS Extension';
    this.postGisError = '';
    this.postGisResult = null;
    this.postGisResultText = '';

    this.metaMenuService.createPostGisExtension().subscribe({
      next: (result: any) => {
        this.postGisStatus = 'success';
        this.postGisResult = result;
        this.postGisResultText = this.formatPostGisResult(result);
        this.toastService.showSuccess('Create PostGIS extension complete');
        this.cdr.markForCheck();
      },
      error: (error: any) => {
        this.postGisStatus = 'error';
        this.postGisError = error?.error?.message || error?.message || 'Failed to create PostGIS extension';
        this.toastService.showError(this.postGisError, false);
        this.cdr.markForCheck();
      }
    });
  }

  formatPostGisResult(result: any): string {
    if (result === null || result === undefined) {
      return 'No result returned';
    }
    if (Array.isArray(result)) {
      if (Array.isArray(result[0]) && result[0].length > 0 && result[0][0]?.postgis_full_version) {
        return result[0][0].postgis_full_version;
      }
      if (result.length > 0 && result[0]?.postgis_full_version) {
        return result[0].postgis_full_version;
      }
      if (result.length === 0) {
        return 'Query executed successfully. (0 rows returned)';
      }
    }
    if (typeof result === 'string') {
      return result;
    }
    return JSON.stringify(result, null, 2);
  }

}
