import {Component, Inject, OnDestroy} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {HttpClient, HttpEventType} from "@angular/common/http";
import {NgxPerfectStackConfig, STACK_CONFIG} from "../../../../../../ngx-perfect-stack-config";
import {finalize, Subscription} from "rxjs";


export class FileItem {
  file: File;
  status: "loading" | "success" | "error" | "cancelled";
  uploadProgress: number | null;
  remotePath?: string
  uploadSub?: Subscription
}

@Component({
  selector: 'lib-upload-dialog',
  templateUrl: './upload-dialog.component.html',
  styleUrls: ['./upload-dialog.component.css']
})
export class UploadDialogComponent implements OnDestroy {

  fileItems: FileItem[] = [];
  isDraggingOver = false;

  constructor(public activeModal: NgbActiveModal,
              @Inject(STACK_CONFIG)
              protected readonly stackConfig: NgxPerfectStackConfig,
              private http: HttpClient) {
  }

  ngOnDestroy(): void {
    this.fileItems.forEach(item => item.uploadSub?.unsubscribe())
  }

  // --- Drag and Drop Handlers ---

  onDragOver(event: DragEvent) {
    event.preventDefault(); // Prevent default browser behavior
    event.stopPropagation(); // Stop event bubbling
    this.isDraggingOver = true; // Activate visual feedback
    // You could also check event.dataTransfer.types here to see if files are being dragged
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
      this.processFiles(files); // Process the dropped files
    }
  }

  // --- File Selection Handler ---

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const files: FileList | null = element.files;
    if (files && files.length > 0) {
      this.processFiles(files); // Process selected files
      element.value = ''; // Reset input value to allow selecting the same file again
    }
  }

  // --- Common File Processing Logic ---

  processFiles(files: FileList): void {
    for (const nextFile of Array.from(files)) {
      // Optional: Add checks here to prevent duplicates or filter by type/size
      if (this.fileItems.some(item => item.file.name === nextFile.name && item.file.size === nextFile.size)) {
        console.log(`Skipping duplicate file: ${nextFile.name}`);
        continue; // Skip if already added
      }

      const nextFileItem: FileItem = {
        file: nextFile,
        status: 'loading',
        uploadProgress: 0,
      };
      this.fileItems.push(nextFileItem);
      this.createURLForUpload(nextFileItem); // Start upload processing for this item
    }
  }

  // --- Upload Logic ---

  createURLForUpload(fileItem: FileItem): void {
    this.http.post(`${this.stackConfig.apiUrl}/media/create/${fileItem.file.name}`, null, {responseType: 'text'}).subscribe(fileUrl => {
      console.log(`create file URL: ${fileUrl}`);
      this.startUpload(fileItem, fileUrl);
    });
  }

  startUpload(fileItem: FileItem, fileUrl: string): void {

    const formData = new FormData();
    formData.append('file', fileItem.file);

    const upload$ = this.http.put<{ path: string }>(`${this.stackConfig.apiUrl}${fileUrl}`, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      // Finalize runs on completion, error, or unsubscription
      finalize(() => {
        console.log(`Upload finalized for ${fileItem.file.name} with status ${fileItem.status}`);
        // Clear subscription reference when finalized
        fileItem.uploadSub = undefined;
      })
    );

    fileItem.uploadSub = upload$.subscribe({
      next: event => {
        if (event.type == HttpEventType.UploadProgress && event.total) {
          fileItem.uploadProgress = Math.round(100 * (event.loaded / event.total));
        } else if (event.type == HttpEventType.Response) {
          if (event.body?.path) {
            const resultPath = event.body.path;
            console.log(`Uploaded ${fileItem.file.name}:`, resultPath);
            fileItem.status = 'success';
            fileItem.remotePath = resultPath;
            fileItem.uploadProgress = 100;
          } else {
            console.error(`Upload successful for ${fileItem.file.name}, but path missing in response.`);
            fileItem.status = 'error';
            fileItem.uploadProgress = null;
          }
        }
      },
      error: err => {
        // Check if the error is due to unsubscription (cancellation)
        if (err.name !== 'SubscriptionError') {
          console.error(`Error uploading ${fileItem.file.name}:`, err);
          fileItem.status = 'error';
          fileItem.uploadProgress = null;
        } else {
          console.log(`Upload cancelled for ${fileItem.file.name}`);
        }
      }
    });
  }

  // --- Modal Actions ---

  onCancel() {
    // Cancel ongoing uploads before dismissing
    this.fileItems.forEach(item => this.cancelUpload(item));
    // TODO: Consider deleting successfully uploaded but uncommitted files on the server if needed
    this.activeModal.dismiss('Cancelled by user');
  }


  onDone() {
    const uploadedPaths = this.fileItems
      .filter(item => item.status === 'success' && item.remotePath)
      .map(item => item.remotePath as string);

    const allFinished = this.fileItems.every(item => item.status !== 'loading');
    if (!allFinished) {
      console.warn('Closing dialog while some uploads may still be in progress.');
      // Optionally, prevent closing or show a warning
    }

    this.activeModal.close(uploadedPaths);
  }

  isDoneEnabled(): boolean {
    // Enable "Done" only if there are files and all of them are finished uploading (successfully or with error/cancelled)
    return this.fileItems.length > 0 && this.fileItems.every(item => item.status !== 'loading');
  }

  cancelUpload(itemToCancel: FileItem) {
    if (itemToCancel.uploadSub) {
      console.log(`Cancelling upload for ${itemToCancel.file.name}`);
      itemToCancel.uploadSub.unsubscribe();
      itemToCancel.status = 'cancelled';
      itemToCancel.uploadProgress = null;
      itemToCancel.uploadSub = undefined;
    }
  }

}
