import {Component, Inject, signal} from '@angular/core';
import {NgForOf, NgIf} from "@angular/common";
import {NgbProgressbar} from "@ng-bootstrap/ng-bootstrap";
import {NgxPerfectStackConfig, STACK_CONFIG} from "../../../ngx-perfect-stack-config";
import {HttpClient, HttpEventType, HttpHeaders} from "@angular/common/http";
import {finalize, Subject, Subscription} from "rxjs";
import {DataImportModel} from "./data-import.model";
import {Job} from "../../../job/job.model";

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
  selector: 'lib-upload-panel',
  imports: [
    NgForOf,
    NgIf,
    NgbProgressbar
  ],
  templateUrl: './upload-panel.component.html',
  styleUrl: './upload-panel.component.css'
})
export class UploadPanelComponent {
  fileItems: FileItem[] = [];
  isDraggingOver = false;

  uploadedData = signal<null | Job>(null);

  constructor(@Inject(STACK_CONFIG)
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
    this.fileItems = [];
    this.uploadedData.set(null);

    const fileArray = Array.from(files);
    const nextFile = fileArray && fileArray[0];
    if(nextFile) {
      // Optional: Add checks here to prevent duplicates or filter by type/size
      if (this.fileItems.some(item => item.file.name === nextFile.name && item.file.size === nextFile.size)) {
        console.log(`Skipping duplicate file: ${nextFile.name}`);
      }

      const nextFileItem: FileItem = {
        file: nextFile,
        status: 'loading',
        uploadProgress: 0,
      };
      this.fileItems.push(nextFileItem);

      console.log('Data Import - file: ', nextFileItem);
      this.upload(nextFileItem); // Start upload processing for this item
    }
  }

  upload(fileItem: FileItem): void {
    const uploadUrl = `${this.stackConfig.apiUrl}/job/data-import/upload`;

    // 1. Create a FormData object to build the multipart request
    const formData = new FormData();

    // 2. Append the file. The first argument, 'file', is the field name
    //    the server API expects. You may need to change this if your
    //    backend expects a different name (e.g., 'upload', 'fileData').
    formData.append('file', fileItem.file, fileItem.file.name);

    // 3. Make the POST request with the FormData.
    //    DO NOT set the 'Content-Type' header manually. The browser
    //    will handle it correctly for FormData.
    const upload$ = this.http.post<Job>(uploadUrl, formData, {
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
        if (event.type === HttpEventType.UploadProgress && event.total) {
          fileItem.uploadProgress = Math.round(100 * (event.loaded / event.total));
        }
        else if (event.type === HttpEventType.Response) {
          console.log(`Upload successful for ${fileItem.file.name}`);

          fileItem.status = 'success';
          fileItem.uploadProgress = 100;

          const apiResponse = event.body;
          console.log('Data Import - upload response: ', apiResponse);

          if(apiResponse && apiResponse.data) {
            this.uploadedData.set(apiResponse);
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
    //this.activeModal.dismiss('Cancelled by user');
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

    //this.activeModal.close(uploadedPaths);
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
