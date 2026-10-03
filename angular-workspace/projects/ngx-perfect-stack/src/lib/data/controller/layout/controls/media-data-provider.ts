import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { SafeUrl } from '@angular/platform-browser';
import { FormContext } from '../../../../data/data-edit/form-service/form.service';
import { CellAttribute } from '../../../../meta/page/meta-page-service/meta-page.service';
import { UntypedFormGroup } from '@angular/forms';

/**
 * Minimum data contract required by media UI controls (e.g. MediaGallery, Media).
 */
export interface MediaItem {
  id?: any;
  /** Primary identifier or path used to resolve the media file */
  path?: string;
  /** Direct URL (pre-signed, static, or CDN) if already known */
  url?: string;
  thumbnailUrl?: string;
  title?: string;
  comments?: string;
  mimeType?: string;
  /** Original entity or custom payload from downstream application */
  data?: any;
}

export interface MediaPageQuery {
  pageNumber: number;
  pageSize: number;
}

export interface MediaPageResult {
  items: MediaItem[];
  totalCount: number;
}

/**
 * Interface that downstream applications can implement to supply
 * data and resolve URLs for media UI controls.
 */
export interface MediaDataProvider {
  /**
   * Fetches paginated or full list of media items.
   */
  loadMedia(
    ctx: FormContext | null,
    cell: CellAttribute,
    query: MediaPageQuery,
    formGroup?: UntypedFormGroup | null
  ): Observable<MediaPageResult>;

  /**
   * Resolves the displayable image URL or SafeUrl for a media item.
   * If omitted, the control will use item.url or item.path directly.
   */
  resolveUrl?(
    item: MediaItem,
    ctx: FormContext | null,
    cell: CellAttribute
  ): Observable<SafeUrl | string>;
}

/**
 * Optional multi-provider or map token for registering named media data providers.
 */
export const MEDIA_DATA_PROVIDERS = new InjectionToken<Map<string, MediaDataProvider>>('MEDIA_DATA_PROVIDERS');
