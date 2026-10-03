import {
  ChangeDetectorRef,
  Component,
  Inject,
  Injector,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Optional,
  SimpleChanges
} from '@angular/core';
import { CellAttribute } from '../../../../../meta/page/meta-page-service/meta-page.service';
import { ControlValueAccessor, UntypedFormArray, UntypedFormGroup } from '@angular/forms';
import { FormContext, FormService } from '../../../../data-edit/form-service/form.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { FormGroupService } from '../../../../data-edit/form-service/form-group.service';
import { MetaEntity } from '../../../../../domain/meta.entity';
import { MetaPage } from '../../../../../domain/meta.page';
import { MetaEntityService } from '../../../../../meta/entity/meta-entity-service/meta-entity.service';
import { MetaPageService } from '../../../../../meta/page/meta-page-service/meta-page.service';
import { NgxPerfectStackConfig, STACK_CONFIG } from '../../../../../ngx-perfect-stack-config';
import {
  MEDIA_DATA_PROVIDERS,
  MediaDataProvider,
  MediaItem,
  MediaPageQuery,
  MediaPageResult
} from '../media-data-provider';
import { DefaultMediaDataProvider } from '../default-media-data-provider.service';

export interface GalleryItem {
  id: any;
  path: string;
  comments?: string;
  mimeType?: string;
  imageSrc: SafeUrl | string | null;
  isLoading: boolean;
  hasError: boolean;
  index: number;
  data?: any;
}

@Component({
  selector: 'lib-media-gallery-control',
  templateUrl: './media-gallery-control.component.html',
  styleUrls: ['./media-gallery-control.component.css'],
  standalone: false
})
export class MediaGalleryControlComponent implements OnInit, OnChanges, OnDestroy, ControlValueAccessor {

  @Input()
  mode: string | null;

  @Input()
  cell: CellAttribute;

  @Input()
  formGroup: UntypedFormGroup;

  @Input()
  ctx: FormContext;

  metaEntityMap: Map<string, MetaEntity>;
  metaPageMap: Map<string, MetaPage>;

  pageNumber = 1;
  pageItems: GalleryItem[] = [];
  totalItemCount = 0;

  private destroy$ = new Subject<void>();
  private pageSubscriptions = new Subscription();
  private imageCache = new Map<string, { safeUrl: SafeUrl | string; rawUrl?: string }>();

  constructor(
    private injector: Injector,
    private defaultProvider: DefaultMediaDataProvider,
    @Optional()
    @Inject(MEDIA_DATA_PROVIDERS)
    private readonly providerMap: Map<string, MediaDataProvider> | null,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    @Inject(STACK_CONFIG)
    protected readonly stackConfig: NgxPerfectStackConfig,
    protected readonly metaEntityService: MetaEntityService,
    protected readonly metaPageService: MetaPageService,
    protected readonly formService: FormService,
    protected readonly formGroupService: FormGroupService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.metaEntityService.metaEntityMap$
      .pipe(takeUntil(this.destroy$))
      .subscribe(map => {
        this.metaEntityMap = map;
      });

    this.metaPageService.metaPageMap$
      .pipe(takeUntil(this.destroy$))
      .subscribe(map => {
        this.metaPageMap = map;
      });

    this.subscribeToFormChanges();
    this.loadPage(1);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cell'] || changes['formGroup'] || changes['ctx']) {
      this.subscribeToFormChanges();
      this.loadPage(this.pageNumber);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.pageSubscriptions.unsubscribe();

    // Revoke all cached object URLs to release memory
    this.imageCache.forEach(cached => {
      if (cached.rawUrl) {
        URL.revokeObjectURL(cached.rawUrl);
      }
    });
    this.imageCache.clear();
  }

  private getProvider(): MediaDataProvider {
    const name = this.cell?.dataProvider;
    if (name) {
      if (this.providerMap && this.providerMap.has(name)) {
        return this.providerMap.get(name)!;
      }
      try {
        const custom = this.injector.get<MediaDataProvider>(name as any, null as any);
        if (custom) {
          return custom;
        }
      } catch (err) {
        console.warn(`[MediaGalleryControl] Could not resolve provider "${name}" from Injector:`, err);
      }
    }
    return this.defaultProvider;
  }

  private subscribeToFormChanges(): void {
    if (this.attributes) {
      this.attributes.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.loadPage(this.pageNumber);
        });
    }
  }

  get metaEntityName(): string | undefined {
    return this.cell?.attribute?.relationshipTarget;
  }

  get attributes(): UntypedFormArray | null {
    return this.formGroup && this.cell && this.cell.attribute
      ? (this.formGroup.get(this.cell.attribute.name) as UntypedFormArray)
      : null;
  }

  get cols(): number {
    const val = parseInt(this.cell?.media_cols || '', 10);
    return isNaN(val) || val <= 0 ? 2 : val;
  }

  get rows(): number {
    const val = parseInt(this.cell?.media_rows || '', 10);
    return isNaN(val) || val <= 0 ? 4 : val;
  }

  get pageSize(): number {
    return this.cols * this.rows;
  }

  get totalItems(): number {
    if (this.cell?.dataProvider) {
      return this.totalItemCount;
    }
    return this.attributes ? this.attributes.length : this.totalItemCount;
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize) || 1;
  }

  get startIndex(): number {
    return (this.pageNumber - 1) * this.pageSize;
  }

  get endIndex(): number {
    return Math.min(this.startIndex + this.pageSize, this.totalItems);
  }

  get gridTemplateColumns(): string {
    return `repeat(${this.cols}, minmax(0, 1fr))`;
  }

  onPageChange(page: number): void {
    this.loadPage(page);
  }

  loadPage(targetPage: number): void {
    if (targetPage < 1) {
      targetPage = 1;
    }
    this.pageNumber = targetPage;

    // Cancel ongoing requests from previous page
    this.pageSubscriptions.unsubscribe();
    this.pageSubscriptions = new Subscription();

    const provider = this.getProvider();
    const query: MediaPageQuery = {
      pageNumber: this.pageNumber,
      pageSize: this.pageSize
    };

    const loadSub = provider.loadMedia(this.ctx, this.cell, query, this.formGroup).subscribe({
      next: (result: MediaPageResult) => {
        this.totalItemCount = result?.totalCount || 0;
        const maxPage = this.totalPages;
        if (this.pageNumber > maxPage && maxPage > 0) {
          this.pageNumber = maxPage;
        }

        const items = result?.items || [];
        const start = (this.pageNumber - 1) * this.pageSize;

        this.pageItems = items.map((item, i) => {
          const pathOrUrl = item.path || item.url || '';
          return {
            id: item.id,
            path: pathOrUrl,
            comments: item.comments,
            mimeType: item.mimeType,
            imageSrc: null,
            isLoading: !!pathOrUrl,
            hasError: false,
            index: start + i,
            data: item.data
          };
        });

        this.pageItems.forEach((galleryItem, idx) => {
          const rawItem = items[idx];
          const cacheKey = rawItem.path || rawItem.url || (rawItem.id != null ? String(rawItem.id) : null);
          if (!cacheKey) {
            galleryItem.isLoading = false;
            return;
          }

          if (this.imageCache.has(cacheKey)) {
            const cached = this.imageCache.get(cacheKey)!;
            galleryItem.imageSrc = cached.safeUrl;
            galleryItem.isLoading = false;
          } else {
            this.resolveImage(galleryItem, rawItem, provider, cacheKey);
          }
        });

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[MediaGalleryControl] Failed to load media items from provider:', err);
        this.pageItems = [];
        this.totalItemCount = 0;
        this.cdr.detectChanges();
      }
    });

    this.pageSubscriptions.add(loadSub);
  }

  private resolveImage(
    galleryItem: GalleryItem,
    rawItem: MediaItem,
    provider: MediaDataProvider,
    cacheKey: string
  ): void {
    if (provider.resolveUrl) {
      const resolveSub = provider.resolveUrl(rawItem, this.ctx, this.cell).subscribe({
        next: (resolvedUrl: SafeUrl | string) => {
          this.imageCache.set(cacheKey, { safeUrl: resolvedUrl });
          galleryItem.imageSrc = resolvedUrl;
          galleryItem.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(`[MediaGalleryControl] Failed to resolve media URL for ${cacheKey}:`, err);
          galleryItem.isLoading = false;
          galleryItem.hasError = true;
          this.cdr.detectChanges();
        }
      });
      this.pageSubscriptions.add(resolveSub);
    } else if (rawItem.url) {
      this.imageCache.set(cacheKey, { safeUrl: rawItem.url });
      galleryItem.imageSrc = rawItem.url;
      galleryItem.isLoading = false;
      this.cdr.detectChanges();
    } else {
      galleryItem.isLoading = false;
      galleryItem.hasError = true;
      this.cdr.detectChanges();
    }
  }

  // ControlValueAccessor implementation
  onChange: any = () => {};
  onTouch: any = () => {};

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  setDisabledState(isDisabled: boolean): void {}

  writeValue(obj: any[]): void {
    if (Array.isArray(obj) && this.attributes) {
      this.attributes.clear();
      obj.forEach(itemData => {
        if (this.mode && this.metaEntityName) {
          const formGroup = this.formGroupService.createFormGroup(
            this.mode,
            this.metaEntityName,
            this.metaPageMap,
            this.metaEntityMap,
            itemData
          );
          this.attributes?.push(formGroup);
        }
      });
      this.loadPage(1);
    } else if (!obj && this.attributes) {
      this.attributes.clear();
      this.loadPage(1);
    } else if (this.cell?.dataProvider) {
      this.loadPage(1);
    }
  }
}
