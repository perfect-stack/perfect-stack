import {Component, Inject, Input, OnDestroy, OnInit} from '@angular/core';
import {CellAttribute} from "../../../../../meta/page/meta-page-service/meta-page.service";
import {ControlValueAccessor, UntypedFormArray, UntypedFormGroup} from "@angular/forms";
import {FormContext, FormService} from "../../../../data-edit/form-service/form.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {UploadDialogComponent} from "./upload-dialog/upload-dialog.component";
import {DomSanitizer, SafeUrl} from "@angular/platform-browser";
import {map, Subject, Subscription, takeUntil} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {FormGroupService} from "../../../../data-edit/form-service/form-group.service";
import {MetaEntity} from "../../../../../domain/meta.entity";
import {Cell, MetaPage} from "../../../../../domain/meta.page";
import {MetaEntityService} from "../../../../../meta/entity/meta-entity-service/meta-entity.service";
import {NgxPerfectStackConfig, STACK_CONFIG} from "../../../../../ngx-perfect-stack-config";

@Component({
  selector: 'lib-media-control',
  templateUrl: './media-control.component.html',
  styleUrls: ['./media-control.component.css']
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
              protected readonly formGroupService: FormGroupService)
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
      this._index = 0; // Reset index if no rows
      this.imageSrc = null; // Clear image if no rows
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
      console.log('loadImage called before value initialization, skipping.');
      // Optionally set isLoading to false if you know it won't load yet
      // this.isLoading = false;
      return;
    }

    const path = this.currentPath;
    console.log(`Load Image: ${path}`);
    if (!path) {
      console.warn(`No path available for current media item. currentPath = ${this.currentPath}`);
      this.isLoading = false;
      return; // No path to load
    }

    this.http.get(this.stackConfig.apiUrl + '/media/locate' + path, { responseType: 'text'}).subscribe((downloadPath: string) => {
      if(downloadPath) {
        this.downloadImage(downloadPath);
      }
      else {
        console.error(`Unable to download file: ${path} at located downloadPath of ${downloadPath}`);
      }
    });

  }

  private downloadImage(path: string): void {
    const downloadPath = path.startsWith('http') ? path : this.stackConfig.apiUrl + "/media" + path;
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
          console.log(`Image loaded for path: ${downloadPath}`);
        },
        error: (err) => {
          console.error(`Failed to load image from path: ${downloadPath}`, err);
          this.isLoading = false;
          // Optionally set a placeholder error image source here
          // this.imageSrc = 'path/to/error-placeholder.png';
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
    console.log('MediaControlComponent writeValue:', obj);
    // Check if obj is the expected array structure for your media files
    if (Array.isArray(obj) && this.attributes) {
      // Clear existing controls first
      this.attributes.clear();
      // Create and push new FormGroups for each item in obj
      obj.forEach(itemData => {
        if (this.mode && this.metaEntityName) {
          // Assuming itemData contains the necessary fields (like 'path')
          const formGroup = this.formGroupService.createFormGroup(this.mode, this.metaEntityName, this.metaPageMap, this.metaEntityMap, itemData);
          if(this.attributes) {
            this.attributes.push(formGroup);
          }
        }
      });

      this._valueInitialized = true;
      this.index = 0; // Reset index
      this.loadImage(); // Load image AFTER data is processed
    }
    else if (!obj) {
      // Handle null/undefined value if necessary
      this.attributes?.clear();
      this._valueInitialized = true;
      this.index = 0;
      this.loadImage(); // Attempt load even if empty (will likely show placeholder)
    }
    else {
      console.warn('MediaControlComponent writeValue received unexpected data:', obj);
    }
  }

  onUpload() {
    const modalRef = this.modalService.open(UploadDialogComponent);
    modalRef.closed.subscribe((uploadedFiles: string[]) => {
      if (uploadedFiles && uploadedFiles.length > 0) {
        console.log('Upload files returned:', uploadedFiles);

        if(this.mode === 'edit') {
          uploadedFiles.map( (nextFilePath) => {
            if(this.mode && this.attributes && this.metaEntityName) {
              const formGroup = this.formGroupService.createFormGroup(this.mode, this.metaEntityName, this.metaPageMap, this.metaEntityMap, null);
              formGroup.controls['path'].setValue(nextFilePath);
              this.attributes.push(formGroup);
              this.index = this.attributes.length - 1;
              this.loadImage();
            }
          });
        }
      }
      else {
        console.log('Upload dialog closed without files.');
      }
    });
  }

  onDelete() {
    console.log(`onDelete() ${this.index}`);
    if(this.attributes) {
      this.attributes.removeAt(this.index);
      this.loadImage();
    }
  }
}
