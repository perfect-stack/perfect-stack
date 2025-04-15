import {Component, Inject} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {HttpClient, HttpEventType} from "@angular/common/http";
import {NgxPerfectStackConfig, STACK_CONFIG} from "../../../../../../ngx-perfect-stack-config";
import {finalize, Subscription} from "rxjs";


export class FileItem {
  file: File;
  status: string;
  uploadProgress: number | null;
  remotePath: string
}

@Component({
  selector: 'lib-upload-dialog',
  templateUrl: './upload-dialog.component.html',
  styleUrls: ['./upload-dialog.component.css']
})
export class UploadDialogComponent {

  fileItems: FileItem[] = [];
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
      for(const nextFile of Array.from(files)) {
        const nextFileItem = {
          file: nextFile,
          status: 'loading',
          uploadProgress: 0,
          remotePath: ''
        };

        this.fileItems.push(nextFileItem);

        const formData = new FormData();
        formData.append('file', nextFile);
        const upload$ = this.http.put(`${this.stackConfig.apiUrl}/media/upload/`, formData, {
          reportProgress: true,
          observe: 'events'
        }).pipe(
          finalize(() => this.reset())
        );

        this.uploadSub = upload$.subscribe(event => {
          if (event.type == HttpEventType.UploadProgress && event.total) {
            nextFileItem.uploadProgress = Math.round(100 * (event.loaded / event.total));
          }

          if(event.type == HttpEventType.Response) {
            const result: any = event.body;
            nextFileItem.status = "success";
            nextFileItem.remotePath = result.path;
            console.log('uploaded file:', result.path );
          }
        });
      }
    }
  }

  onDone() {
    const filePaths = this.fileItems.map(nextFileItem => nextFileItem.remotePath);
    console.log('onDone()', filePaths);
    this.activeModal.close(filePaths);
  }

  isDoneEnabled() {
    return true;
  }

  cancelUpload() {
    if(this.uploadSub) {
      this.uploadSub.unsubscribe();
    }
    this.reset();
  }

  reset() {
    this.uploadSub = null;
  }
}
