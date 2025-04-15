import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {CellAttribute} from "../../../../../meta/page/meta-page-service/meta-page.service";
import {ControlValueAccessor, UntypedFormArray, UntypedFormGroup} from "@angular/forms";
import {FormContext} from "../../../../data-edit/form-service/form.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {UploadDialogComponent} from "./upload-dialog/upload-dialog.component";
import {DomSanitizer, SafeUrl} from "@angular/platform-browser";
import {map, Subject, Subscription, takeUntil} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {FormGroupService} from "../../../../data-edit/form-service/form-group.service";
import {MetaEntity} from "../../../../../domain/meta.entity";
import {MetaPage} from "../../../../../domain/meta.page";
import {MetaEntityService} from "../../../../../meta/entity/meta-entity-service/meta-entity.service";

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
  rows: any[]
  imageSrc: SafeUrl | null = null; // Property to hold the safe URL for the image
  isLoading = false; // Flag for loading state
  private imageSubscription: Subscription | null = null; // To manage the HTTP subscription
  currentObjectUrl: string | null = null; // To store the raw object URL for revocation

  constructor(private modalService: NgbModal,
              private http: HttpClient,
              private sanitizer: DomSanitizer,
              protected readonly metaEntityService: MetaEntityService,
              protected readonly formGroupService: FormGroupService)
  {}

  ngOnInit(): void {
    this.metaEntityService.metaEntityMap$.pipe(
      takeUntil(this.destroy$) // Automatically unsubscribe when destroy$ emits
    ).subscribe(map => {
      this.metaEntityMap = map;
      // Now you can use this.metaEntityMap, for example, in onUpload
      console.log('MetaEntityMap loaded in MediaControlComponent:', this.metaEntityMap);
    });

    if(this.formGroup && this.cell && this.cell.attribute) {
      const control = this.formGroup.get(this.cell.attribute.name);
      if(control) {
        console.log("XXX-MEDIA", control.value)
        this.rows = control.value;
        this.loadImage();
      }
    }
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

  get index(): number {
    return this._index;
  }

  set index(value: number) {
    if (this.rows && this.rows.length > 0) {
      let newIndex = value;
      if (newIndex >= this.rows.length) {
        newIndex = 0;
      } else if (newIndex < 0) {
        newIndex = this.rows.length - 1;
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
    const row = this.currentRow;
    if (row && row.path) {
      let path = row.path;
      // Assuming path is relative to the media endpoint
      if (path && !path.startsWith("http")) {
        // Use your configured API URL if available, otherwise fallback
        // TODO: Inject STACK_CONFIG or similar to get the base API URL
        //const baseUrl = (this.ctx?.config?.apiUrl || 'http://localhost:3080') + '/media/';
        const baseUrl = 'http://localhost:3080' + '/media/';
        path = baseUrl + path;
      }
      return path;
    }
    return null;
  }

  get currentRow(): any | null {
    return this.rows && this.rows.length > this.index ? this.rows[this.index] : null;
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

    const path = this.currentPath;
    if (!path) {
      console.warn('No path available for current media item.');
      this.isLoading = false;
      return; // No path to load
    }

    this.imageSubscription = this.http.get(path, { responseType: 'blob' })
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
          console.log(`Image loaded for path: ${path}`);
        },
        error: (err) => {
          console.error(`Failed to load image from path: ${path}`, err);
          this.isLoading = false;
          // Optionally set a placeholder error image source here
          // this.imageSrc = 'path/to/error-placeholder.png';
        }
      });
  }

  registerOnChange(fn: any): void {
  }

  registerOnTouched(fn: any): void {
  }

  setDisabledState(isDisabled: boolean): void {
  }

  writeValue(obj: any): void {
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
            }
          });
        }
      }
      else {
        console.log('Upload dialog closed without files.');
      }
    });
  }
}
