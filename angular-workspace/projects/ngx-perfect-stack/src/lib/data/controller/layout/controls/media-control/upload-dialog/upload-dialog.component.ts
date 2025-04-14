import {Component, Inject} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {HttpClient, HttpEventType} from "@angular/common/http";
import {NgxPerfectStackConfig, STACK_CONFIG} from "../../../../../../ngx-perfect-stack-config";
import {finalize, Subscription} from "rxjs";

@Component({
  selector: 'lib-upload-dialog',
  templateUrl: './upload-dialog.component.html',
  styleUrls: ['./upload-dialog.component.css']
})
export class UploadDialogComponent {

  selectedFiles: File[] = [];
  uploadProgress: number | null;
  private uploadSub: Subscription | null;

  constructor(public activeModal: NgbActiveModal,
              @Inject(STACK_CONFIG)
              protected readonly stackConfig: NgxPerfectStackConfig,
              private http: HttpClient) {
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

      const file: File = this.selectedFiles[0];
      const formData = new FormData();
      formData.append('file', file);
      const upload$ = this.http.put(`${this.stackConfig.apiUrl}/media/upload/`, formData, {
        reportProgress: true,
        observe: 'events'
      })
      .pipe(
        finalize(() => this.reset())
      );

      this.uploadSub = upload$.subscribe(event => {
        if (event.type == HttpEventType.UploadProgress && event.total) {
          this.uploadProgress = Math.round(100 * (event.loaded / event.total));
        }

        if(event.type == HttpEventType.Response) {
          const result: any = event.body;
          console.log('uploaded file:', result.path );
          this.activeModal.close([result.path]);
        }
      });
    }
  }

  onUpload() {
  }

  isUploadEnabled() {
    return true;
  }

  cancelUpload() {
    if(this.uploadSub) {
      this.uploadSub.unsubscribe();
    }
    this.reset();
  }

  reset() {
    this.uploadProgress = null;
    this.uploadSub = null;
  }
}
