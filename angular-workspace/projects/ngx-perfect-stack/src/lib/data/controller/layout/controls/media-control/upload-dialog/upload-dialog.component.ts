import {ChangeDetectorRef, Component, Inject, NgZone, OnDestroy} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import { HttpClient, HttpEventType, HttpHeaders } from "@angular/common/http";
import {NgxPerfectStackConfig, STACK_CONFIG} from "../../../../../../ngx-perfect-stack-config";
import {finalize, Subscription} from "rxjs";
import {withDIY} from "../../../../../../authentication/auth-interceptor";


export class FileItem {
  file: File;
  status: "loading" | "success" | "error" | "cancelled";
  uploadProgress: number | null;
  remotePath?: string
  uploadSub?: Subscription
}

export interface CreateFileResponse {
  resourceKey: string;
  resourceUrl: string;
}

@Component({
    selector: 'lib-upload-dialog',
    templateUrl: './upload-dialog.component.html',
    styleUrls: ['./upload-dialog.component.css'],
    standalone: false
})
export class UploadDialogComponent implements OnDestroy {

  fileItems: FileItem[] = [];
  isDraggingOver = false;

  constructor(public activeModal: NgbActiveModal,
              @Inject(STACK_CONFIG)
              protected readonly stackConfig: NgxPerfectStackConfig,
              private http: HttpClient,
              private ngZone: NgZone,
              private cdr: ChangeDetectorRef) {
  }

  ngOnDestroy(): void {
    this.fileItems.forEach(item => item.uploadSub?.unsubscribe());
  }

  // --- Drag and Drop Handlers ---

  onDragOver(event: DragEvent) {
    event.preventDefault(); // Prevent default browser behavior
    event.stopPropagation(); // Stop event bubbling
    this.isDraggingOver = true; // Activate visual feedback
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver = false; // Deactivate visual feedback
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver = false; // Deactivate visual feedback

    const files = event.dataTransfer?.files; // Get files from the drop event
    if (files && files.length > 0) {
      console.log(`[UploadDialog] onDrop: received ${files.length} file(s)`);
      this.processFiles(files); // Process the dropped files
    }
  }

  // --- File Selection Handler ---

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const files: FileList | null = element.files;
    if (files && files.length > 0) {
      console.log(`[UploadDialog] onFileSelected: selected ${files.length} file(s)`);
      this.processFiles(files); // Process selected files
      element.value = ''; // Reset input value to allow selecting the same file again
    }
  }

  // --- Common File Processing Logic ---

  processFiles(files: FileList): void {
    console.log(`[UploadDialog] processFiles: processing ${files.length} file(s)`);
    for (const nextFile of Array.from(files)) {
      if (this.fileItems.some(item => item.file.name === nextFile.name && item.file.size === nextFile.size)) {
        console.log(`[UploadDialog] Skipping duplicate file: ${nextFile.name}`);
        continue;
      }

      const nextFileItem: FileItem = {
        file: nextFile,
        status: 'loading',
        uploadProgress: 0,
      };
      this.fileItems.push(nextFileItem);
      console.log(`[UploadDialog] Enqueued file: ${nextFile.name} (${nextFile.size} bytes, type=${nextFile.type}). Total items: ${this.fileItems.length}`);
      this.createURLForUpload(nextFileItem);
    }
    this.cdr.detectChanges();
  }

  // --- Upload Logic ---

  createURLForUpload(fileItem: FileItem): void {
    const url = `${this.stackConfig.apiUrl}/media/create/${fileItem.file.name}`;
    console.log(`[UploadDialog] Requesting createFile from: ${url}`);
    this.http.post<CreateFileResponse>(url, null).subscribe({
      next: (createFileResponse) => {
        console.log(`[UploadDialog] createFile response for ${fileItem.file.name}:`, createFileResponse);
        this.startUpload(fileItem, createFileResponse);
      },
      error: (err) => {
        console.error(`[UploadDialog] createFile error for ${fileItem.file.name}:`, err);
        this.ngZone.run(() => {
          fileItem.status = 'error';
          fileItem.uploadProgress = null;
          this.cdr.detectChanges();
        });
      }
    });
  }

  startUpload(fileItem: FileItem, createFileResponse: CreateFileResponse): void {
    const uploadUrl = createFileResponse.resourceUrl.startsWith('http') ? createFileResponse.resourceUrl : this.stackConfig.apiUrl + createFileResponse.resourceUrl;
    console.log(`[UploadDialog] startUpload: uploading to ${uploadUrl}, file type: ${fileItem.file.type}`);
    const headers = new HttpHeaders({'Content-Type': fileItem.file.type});
    const upload$ = this.http.put<{ path: string }>(uploadUrl, fileItem.file, {
      headers: headers,
      reportProgress: true,
      observe: 'events',
      context: withDIY()
    }).pipe(
      finalize(() => {
        this.ngZone.run(() => {
          console.log(`[UploadDialog] Upload finalized for ${fileItem.file.name} with status: ${fileItem.status}`);
          fileItem.uploadSub = undefined;
          this.cdr.detectChanges();
        });
      })
    );

    fileItem.uploadSub = upload$.subscribe({
      next: event => {
        this.ngZone.run(() => {
          if (event.type == HttpEventType.UploadProgress && event.total) {
            fileItem.uploadProgress = Math.round(100 * (event.loaded / event.total));
            console.log(`[UploadDialog] Upload progress for ${fileItem.file.name}: ${fileItem.uploadProgress}% (${event.loaded}/${event.total})`);
            this.cdr.markForCheck();
          }
          else if (event.type == HttpEventType.Response) {
            console.log(`[UploadDialog] Upload successful for ${fileItem.file.name}:`, event);
            fileItem.status = 'success';
            fileItem.remotePath = createFileResponse.resourceKey;
            fileItem.uploadProgress = 100;
            console.log(`[UploadDialog] File item marked success: name=${fileItem.file.name}, remotePath=${fileItem.remotePath}, isDoneEnabled=${this.isDoneEnabled()}`);
            this.cdr.detectChanges();
          }
        });
      },
      error: err => {
        this.ngZone.run(() => {
          if (err.name !== 'SubscriptionError') {
            console.error(`[UploadDialog] Error uploading ${fileItem.file.name}:`, err);
            fileItem.status = 'error';
            fileItem.uploadProgress = null;
          } else {
            console.log(`[UploadDialog] Upload cancelled for ${fileItem.file.name}`);
          }
          this.cdr.detectChanges();
        });
      }
    });
  }

  // --- Modal Actions ---

  onCancel() {
    console.log('[UploadDialog] onCancel() clicked.');
    this.fileItems.forEach(item => this.cancelUpload(item));
    this.activeModal.dismiss('Cancelled by user');
  }

  onDone() {
    console.log('[UploadDialog] onDone() clicked. Current fileItems:', this.fileItems.map(i => ({ name: i.file.name, status: i.status, remotePath: i.remotePath })));
    const uploadedPaths = this.fileItems
      .filter(item => item.status === 'success' && item.remotePath)
      .map(item => item.remotePath as string);

    const allFinished = this.fileItems.every(item => item.status !== 'loading');
    if (!allFinished) {
      console.warn('[UploadDialog] Closing dialog while some uploads may still be in progress.');
    }

    console.log('[UploadDialog] Closing activeModal with uploadedPaths:', uploadedPaths);
    this.activeModal.close(uploadedPaths);
  }

  isDoneEnabled(): boolean {
    const hasFiles = this.fileItems.length > 0;
    const allFinished = hasFiles && this.fileItems.every(item => item.status !== 'loading');
    return allFinished;
  }

  cancelUpload(itemToCancel: FileItem) {
    if (itemToCancel.uploadSub) {
      console.log(`[UploadDialog] Cancelling upload for ${itemToCancel.file.name}`);
      itemToCancel.uploadSub.unsubscribe();
      itemToCancel.status = 'cancelled';
      itemToCancel.uploadProgress = null;
      itemToCancel.uploadSub = undefined;
    }
  }

}
