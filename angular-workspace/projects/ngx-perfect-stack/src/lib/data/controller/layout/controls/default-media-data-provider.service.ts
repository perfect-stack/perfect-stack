import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { map, Observable, of, switchMap, throwError } from 'rxjs';
import { UntypedFormArray, UntypedFormGroup } from '@angular/forms';
import { FormContext } from '../../../../data/data-edit/form-service/form.service';
import { CellAttribute } from '../../../../meta/page/meta-page-service/meta-page.service';
import { NgxPerfectStackConfig, STACK_CONFIG } from '../../../../ngx-perfect-stack-config';
import { MediaDataProvider, MediaItem, MediaPageQuery, MediaPageResult } from './media-data-provider';

/**
 * Default MediaDataProvider implementation.
 * Reads media items from the parent entity's UntypedFormArray attribute
 * and downloads media via perfect-stack's default /media/locate and /media endpoints.
 */
@Injectable({
  providedIn: 'root'
})
export class DefaultMediaDataProvider implements MediaDataProvider {

  constructor(
    private readonly http: HttpClient,
    private readonly sanitizer: DomSanitizer,
    @Inject(STACK_CONFIG)
    protected readonly stackConfig: NgxPerfectStackConfig
  ) {}

  loadMedia(
    ctx: FormContext | null,
    cell: CellAttribute,
    query: MediaPageQuery,
    formGroup?: UntypedFormGroup | null
  ): Observable<MediaPageResult> {
    const attributeName = cell?.attribute?.name;
    const formArray = formGroup && attributeName
      ? (formGroup.get(attributeName) as UntypedFormArray)
      : null;

    if (!formArray || formArray.length === 0) {
      return of({ items: [], totalCount: 0 });
    }

    const totalCount = formArray.length;
    const start = (query.pageNumber - 1) * query.pageSize;
    const end = Math.min(start + query.pageSize, totalCount);

    if (start >= totalCount) {
      return of({ items: [], totalCount });
    }

    const slice = formArray.controls.slice(start, end);
    const items: MediaItem[] = slice.map(ctrl => {
      const fg = ctrl as UntypedFormGroup;
      const path = fg.controls['path']?.value;
      const comments = fg.controls['comments']?.value;
      const mimeType = fg.controls['mime_type']?.value;
      const id = fg.controls['id']?.value;

      return {
        id,
        path,
        comments,
        mimeType,
        data: fg.value
      };
    });

    return of({ items, totalCount });
  }

  resolveUrl(
    item: MediaItem,
    ctx: FormContext | null,
    cell: CellAttribute
  ): Observable<SafeUrl | string> {
    const path = item.path || item.url;
    if (!path) {
      return throwError(() => new Error('[DefaultMediaDataProvider] No path or url available for item'));
    }

    const locateUrl = `${this.stackConfig.apiUrl}/media/locate/${path}`;
    return this.http.get(locateUrl, { responseType: 'text' }).pipe(
      switchMap((downloadPath: string) => {
        if (!downloadPath) {
          return throwError(() => new Error(`[DefaultMediaDataProvider] Unable to locate file: ${path}`));
        }
        const finalUrl = downloadPath.startsWith('http')
          ? downloadPath
          : `${this.stackConfig.apiUrl}/media${downloadPath}`;

        return this.http.get(finalUrl, { responseType: 'blob' }).pipe(
          map(blob => {
            const rawUrl = URL.createObjectURL(blob);
            return this.sanitizer.bypassSecurityTrustUrl(rawUrl);
          })
        );
      })
    );
  }
}
