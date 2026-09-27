import {
  ChangeDetectorRef,
  Component,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
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

export interface GalleryItem {
  id: any;
  path: string;
  comments?: string;
  mimeType?: string;
  imageSrc: SafeUrl | null;
  isLoading: boolean;
  hasError: boolean;
  index: number;
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

  private destroy$ = new Subject<void>();
  private pageSubscriptions = new Subscription();
  private imageCache = new Map<string, { safeUrl: SafeUrl; rawUrl: string }>();

  constructor(
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
    if (changes['cell'] || changes['formGroup']) {
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
    return this.attributes ? this.attributes.length : 0;
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
    const maxPage = this.totalPages;
    if (targetPage > maxPage && maxPage > 0) {
      targetPage = maxPage;
    }
    this.pageNumber = targetPage;

    // Cancel ongoing downloads from previous page
    this.pageSubscriptions.unsubscribe();
    this.pageSubscriptions = new Subscription();

    if (!this.attributes || this.totalItems === 0) {
      this.pageItems = [];
      this.cdr.detectChanges();
      return;
    }

    const start = this.startIndex;
    const end = this.endIndex;
    const slice = this.attributes.controls.slice(start, end);

    this.pageItems = slice.map((ctrl, i) => {
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
        imageSrc: null,
        isLoading: !!path,
        hasError: false,
        index: start + i
      };
    });

    this.pageItems.forEach(item => {
      if (!item.path) {
        item.isLoading = false;
        return;
      }

      if (this.imageCache.has(item.path)) {
        const cached = this.imageCache.get(item.path)!;
        item.imageSrc = cached.safeUrl;
        item.isLoading = false;
      } else {
        this.fetchImage(item);
      }
    });

    this.cdr.detectChanges();
  }

  private fetchImage(item: GalleryItem): void {
    const locateUrl = `${this.stackConfig.apiUrl}/media/locate/${item.path}`;
    const locateSub = this.http.get(locateUrl, { responseType: 'text' }).subscribe({
      next: (downloadPath: string) => {
        if (downloadPath) {
          const finalUrl = downloadPath.startsWith('http')
            ? downloadPath
            : `${this.stackConfig.apiUrl}/media${downloadPath}`;

          const dlSub = this.http.get(finalUrl, { responseType: 'blob' }).subscribe({
            next: (blob) => {
              const rawUrl = URL.createObjectURL(blob);
              const safeUrl = this.sanitizer.bypassSecurityTrustUrl(rawUrl);
              this.imageCache.set(item.path, { safeUrl, rawUrl });
              item.imageSrc = safeUrl;
              item.isLoading = false;
              this.cdr.detectChanges();
            },
            error: (err) => {
              console.error(`[MediaGalleryControl] Failed to download image from ${finalUrl}:`, err);
              item.isLoading = false;
              item.hasError = true;
              this.cdr.detectChanges();
            }
          });
          this.pageSubscriptions.add(dlSub);
        } else {
          item.isLoading = false;
          item.hasError = true;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error(`[MediaGalleryControl] Failed to locate image ${item.path}:`, err);
        item.isLoading = false;
        item.hasError = true;
        this.cdr.detectChanges();
      }
    });
    this.pageSubscriptions.add(locateSub);
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
    } else if (!obj) {
      this.attributes?.clear();
      this.loadPage(1);
    }
  }
}
