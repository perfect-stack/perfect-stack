import {ChangeDetectorRef, Component, Inject, Input, OnDestroy, OnInit} from '@angular/core';
import {CellAttribute} from "../../../../../meta/page/meta-page-service/meta-page.service";
import {ControlValueAccessor, UntypedFormArray, UntypedFormGroup} from "@angular/forms";
import {FormContext, FormService} from "../../../../data-edit/form-service/form.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {UploadDialogComponent} from "./upload-dialog/upload-dialog.component";
import {DomSanitizer, SafeUrl} from "@angular/platform-browser";
import {map, Subject, Subscription, takeUntil} from "rxjs";
import { HttpClient } from "@angular/common/http";
import {FormGroupService} from "../../../../data-edit/form-service/form-group.service";
import {MetaEntity} from "../../../../../domain/meta.entity";
import {Cell, MetaPage} from "../../../../../domain/meta.page";
import {MetaEntityService} from "../../../../../meta/entity/meta-entity-service/meta-entity.service";
import {NgxPerfectStackConfig, STACK_CONFIG} from "../../../../../ngx-perfect-stack-config";

@Component({
    selector: 'lib-media-control',
    templateUrl: './media-control.component.html',
    styleUrls: ['./media-control.component.css'],
    standalone: false
})
export class MediaControlComponent implements OnInit, OnDestroy, ControlValueAccessor {

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
  private destroy$ = new Subject<void>(); // Subject to trigger unsubscription

  private _index = 0;
  imageSrc: SafeUrl | null = null; // Property to hold the safe URL for the image
  isLoading = false; // Flag for loading state
  private imageSubscription: Subscription | null = null; // To manage the HTTP subscription
  currentObjectUrl: string | null = null; // To store the raw object URL for revocation

  private _valueInitialized = false;

  commentCell: CellAttribute;

  constructor(private modalService: NgbModal,
              private http: HttpClient,
              private sanitizer: DomSanitizer,
              @Inject(STACK_CONFIG)
              protected readonly stackConfig: NgxPerfectStackConfig,
              protected readonly metaEntityService: MetaEntityService,
              protected readonly formService: FormService,
              protected readonly formGroupService: FormGroupService,
              private cdr: ChangeDetectorRef)
  {}

  ngOnInit(): void {
    this.metaEntityService.metaEntityMap$.pipe(
      takeUntil(this.destroy$) // Automatically unsubscribe when destroy$ emits
    ).subscribe(map => {
      this.metaEntityMap = map;

      if(this.cell.metaEntity) {
        this.commentCell = this.formService.toCellAttribute({
          width: "1",
          height: "3",
          attributeName: "comments",
          component: "TextArea"
        }, this.cell.metaEntity);
      }
    });
    this.loadImage();
  }

  ngOnDestroy(): void {
    // Clean up subscription and revoke object URL when component is destroyed
    this.imageSubscription?.unsubscribe();
    this.revokeCurrentImageUrl();

    this.destroy$.next();
    this.destroy$.complete();
  }

  get metaEntityName(): string | undefined {
    return this.cell.attribute?.relationshipTarget;
  }

  get attributes(): UntypedFormArray | null {
    return this.formGroup && this.cell && this.cell.attribute ? this.formGroup.get(this.cell.attribute.name) as UntypedFormArray : null;
  }

  get imageCount(): number {
    return this.attributes ? this.attributes.length : 0;
  }

  get index(): number {
    return this._index;
  }

  set index(value: number) {
    if (this.attributes && this.attributes.length > 0) {
      let newIndex = value;
      if (newIndex >= this.attributes.length) {
        newIndex = 0;
      } else if (newIndex < 0) {
        newIndex = this.attributes.length - 1;
      }

      if (this._index !== newIndex) {
        this._index = newIndex;
        this.loadImage(); // Load the new image when index changes
      }
    } else {
      this._index = 0;
      this.loadImage();
    }
  }

  get currentPath(): string | null {
    const rowData = this.currentRow;
    return (rowData && rowData.controls['path']) ? rowData.controls['path'].value : null;
  }

  get currentRow(): any | null {
    return this.attributes && this.attributes.length > this.index ? this.attributes.at(this.index) : null;
  }

  incrementIndex(): void {
    this.index++;
  }

  decrementIndex(): void {
    this.index--;
  }

  private revokeCurrentImageUrl(): void {
    if (this.currentObjectUrl) {
      URL.revokeObjectURL(this.currentObjectUrl);
      this.currentObjectUrl = null;
      this.imageSrc = null;
    }
  }

  private loadImage(): void {
    this.isLoading = true;
    this.imageSrc = null; // Clear previous image immediately
    this.imageSubscription?.unsubscribe(); // Cancel any pending request
    this.revokeCurrentImageUrl(); // Revoke previous URL

    if (!this._valueInitialized && !this.attributes?.length) {
      console.log('[MediaControl] loadImage called before value initialization, skipping.');
      this.isLoading = false;
      return;
    }

    const path = this.currentPath;
    console.log(`[MediaControl] Load Image: currentPath = ${path}, index = ${this.index}, total images = ${this.attributes?.length}`);
    if (!path) {
      console.warn(`[MediaControl] No path available for current media item. currentPath = ${this.currentPath}`);
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    const locateUrl = this.stackConfig.apiUrl + '/media/locate/' + path;
    console.log(`[MediaControl] Requesting locate from: ${locateUrl}`);
    this.http.get(locateUrl, { responseType: 'text'}).subscribe({
      next: (downloadPath: string) => {
        console.log(`[MediaControl] Locate result for ${path}: ${downloadPath}`);
        if(downloadPath) {
          this.downloadImage(downloadPath);
        }
        else {
          console.error(`[MediaControl] Unable to download file: ${path} at located downloadPath of ${downloadPath}`);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error(`[MediaControl] Locate error for ${path}:`, err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private downloadImage(path: string): void {
    const downloadPath = path.startsWith('http') ? path : this.stackConfig.apiUrl + "/media" + path;
    console.log(`[MediaControl] downloadImage: fetching from ${downloadPath}`);
    this.imageSubscription = this.http.get(downloadPath, { responseType: 'blob' })
      .pipe(
        map(blob => {
          this.currentObjectUrl = URL.createObjectURL(blob);
          return this.sanitizer.bypassSecurityTrustUrl(this.currentObjectUrl);
        })
      )
      .subscribe({
        next: (safeUrl) => {
          this.imageSrc = safeUrl;
          this.isLoading = false;
          console.log(`[MediaControl] Image loaded successfully for path: ${downloadPath}`);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(`[MediaControl] Failed to load image from path: ${downloadPath}`, err);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
    });
  }

  onChange: any = () => {}
  onTouch: any = () => {}

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  setDisabledState(isDisabled: boolean): void {
  }

  writeValue(obj: any[]): void {
    console.log('[MediaControl] writeValue received:', obj);
    if (Array.isArray(obj) && this.attributes) {
      this.attributes.clear();
      obj.forEach(itemData => {
        if (this.mode && this.metaEntityName) {
          const formGroup = this.formGroupService.createFormGroup(this.mode, this.metaEntityName, this.metaPageMap, this.metaEntityMap, itemData);
          this.attributes?.push(formGroup);
        }
      });
      this._valueInitialized = true;
      this.index = 0; // Reset index
      this.loadImage(); // Load image AFTER data is processed
    }
    else if (!obj) {
      this.attributes?.clear();
      this._valueInitialized = true;
      this.index = 0;
      this.loadImage();
    }
    else {
      console.warn('[MediaControl] writeValue received unexpected data:', obj);
    }
  }

  onUpload() {
    console.log('[MediaControl] onUpload() clicked. Mode:', this.mode, 'metaEntityName:', this.metaEntityName, 'attributes length:', this.attributes?.length);
    const modalRef = this.modalService.open(UploadDialogComponent);
    modalRef.closed.subscribe((uploadedFiles: string[]) => {
      console.log('[MediaControl] modalRef.closed emitted with:', uploadedFiles);
      if (uploadedFiles && uploadedFiles.length > 0) {
        if(this.mode === 'edit') {
          uploadedFiles.map( (nextFilePath) => {
            if(this.mode && this.attributes && this.metaEntityName) {
              console.log(`[MediaControl] Creating form group for ${this.metaEntityName} with path ${nextFilePath}`);
              const formGroup = this.formGroupService.createFormGroup(this.mode, this.metaEntityName, this.metaPageMap, this.metaEntityMap, null);
              formGroup.controls['path'].setValue(nextFilePath);
              this.attributes.push(formGroup);
              this.formGroup?.markAsDirty();
              this.index = this.attributes.length - 1;
              console.log(`[MediaControl] Successfully added form group. Total items now: ${this.attributes.length}, new index: ${this.index}`);
              this.loadImage();
            } else {
              console.warn('[MediaControl] Cannot add file, missing dependencies:', {
                mode: this.mode,
                hasAttributes: !!this.attributes,
                metaEntityName: this.metaEntityName
              });
            }
          });
          this.cdr.detectChanges();
        } else {
          console.warn('[MediaControl] Not in edit mode, current mode is:', this.mode);
        }
      }
      else {
        console.log('[MediaControl] Upload dialog closed without files.');
      }
    });

    modalRef.dismissed.subscribe((reason) => {
      console.log('[MediaControl] modalRef.dismissed with reason:', reason);
    });
  }

  onDelete() {
    console.log(`[MediaControl] onDelete() index=${this.index}`);
    if(this.attributes) {
      this.attributes.removeAt(this.index);
      this.formGroup?.markAsDirty();
      this.loadImage();
      this.cdr.detectChanges();
    }
  }
}
