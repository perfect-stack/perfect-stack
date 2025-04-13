import { Component } from '@angular/core';
import {NgbActiveModal, NgbModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'lib-upload-dialog',
  templateUrl: './upload-dialog.component.html',
  styleUrls: ['./upload-dialog.component.css']
})
export class UploadDialogComponent {

  selectedFiles: File[] = [];

  constructor(public activeModal: NgbActiveModal) {
  }

  onCancel() {
    // TODO: delete any uncommitted files
    this.activeModal.dismiss()
  }

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const files: FileList | null = element.files;

    if(files) {
      this.selectedFiles.push(...Array.from(files));
      console.log('Files selected:', this.selectedFiles);
      // Optionally, you could immediately trigger the upload here
      // or update the UI to show selected file names
    }
  }

  onUpload() {
    this.activeModal.close(['some files here']);
  }

  isUploadEnabled() {
    return true;
  }
}
