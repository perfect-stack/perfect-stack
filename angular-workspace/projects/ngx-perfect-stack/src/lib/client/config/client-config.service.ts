import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  NgxPerfectStackConfig,
  STACK_CONFIG,
} from '../../ngx-perfect-stack-config';
import { map, Observable, shareReplay } from 'rxjs';
import { MetaEditControlValue } from '../../domain/meta-edit';

@Injectable({
  providedIn: 'root',
})
export class ClientConfigService {
  private config$: Observable<any> | null = null;

  constructor(
    @Inject(STACK_CONFIG)
    protected readonly stackConfig: NgxPerfectStackConfig,
    protected readonly http: HttpClient,
  ) {}

  getConfig(): Observable<any> {
    if (!this.config$) {
      this.config$ = this.http
        .get<any>(`${this.stackConfig.apiUrl}/client/config`)
        .pipe(shareReplay(1));
    }
    return this.config$;
  }

  isMetaEditEnabled(
    controlValue: MetaEditControlValue | string,
  ): Observable<boolean> {
    return this.getConfig().pipe(
      map((config) => {
        const metaEditEnabled = config?.META_EDIT_ENABLED;
        if (!metaEditEnabled) {
          return false;
        }
        const enabledList = metaEditEnabled
          .split(',')
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0);
        return enabledList.includes(controlValue);
      }),
    );
  }
}
