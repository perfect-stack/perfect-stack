import {Component, Input, OnInit} from '@angular/core';
import {CellAttribute} from "../../../../../meta/page/meta-page-service/meta-page.service";
import {ControlValueAccessor, UntypedFormGroup} from "@angular/forms";
import {FormContext} from "../../../../data-edit/form-service/form.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {UploadDialogComponent} from "./upload-dialog/upload-dialog.component";

@Component({
  selector: 'lib-media-control',
  templateUrl: './media-control.component.html',
  styleUrls: ['./media-control.component.css']
})
export class MediaControlComponent implements OnInit, ControlValueAccessor {

  @Input()
  mode: string | null;

  @Input()
  cell: CellAttribute;

  @Input()
  formGroup: UntypedFormGroup;

  @Input()
  ctx: FormContext;

  index = 0;
  rows: any[]


  constructor(private modalService: NgbModal) {
  }

  ngOnInit(): void {
    if(this.formGroup && this.cell && this.cell.attribute) {
      const control = this.formGroup.get(this.cell.attribute.name);
      if(control) {
        console.log("XXX-MEDIA", control.value)
        this.rows = control.value;
      }
    }
  }

  get currentPath() {
    let path = this.currentRow.path;
    if(path && !path.startsWith("http")) {
      path = "http://localhost:3080/media/" + path
    }
    return path;
  }

  get currentRow() {
    return this.rows[this.index];
  }

  incrementIndex() {
    this.index++;
    if(this.index >= this.rows.length) {
      this.index = 0;
    }
  }

  decrementIndex() {
    this.index--;
    if(this.index < 0) {
      this.index = this.rows.length - 1;
    }
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
    const uploadDialog = modalRef.componentInstance as UploadDialogComponent;
    modalRef.closed.subscribe((files) => {
      console.log('Upload files:', files);
    })
  }
}
