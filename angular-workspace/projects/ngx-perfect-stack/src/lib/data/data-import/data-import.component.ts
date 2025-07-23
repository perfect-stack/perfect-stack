import {Component, effect, Injector, viewChild} from '@angular/core';
import {UploadPanelComponent} from "./upload-panel/upload-panel.component";
import {JsonPipe} from "@angular/common";
import {AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {DataImportModel} from "./upload-panel/data-import.model";

@Component({
  selector: 'lib-data-import',
  imports: [
    UploadPanelComponent,
    JsonPipe,
    ReactiveFormsModule
  ],
  templateUrl: './data-import.component.html',
  styleUrl: './data-import.component.css'
})
export class DataImportComponent {

  uploadPanel = viewChild(UploadPanelComponent);

  data: DataImportModel;
  form: FormArray;


  constructor(private injector: Injector) {
    effect(() => {
      const  uploadPanel = this.uploadPanel();
      if(uploadPanel) {
        const  uploadedData = uploadPanel.uploadedData();
        console.log('Data Import - uploadedData: ', uploadedData);
        if(uploadedData) {
          this.data = uploadedData;
          this.createForm(this.data);
        }
      }
    }, {injector: this.injector});
  }

  private createForm(data: DataImportModel) {
    this.form = new FormArray<FormGroup>([]);
    const dataRows = data.dataRows;
    for (let rowIdx = 0; rowIdx < dataRows.length; rowIdx++) {
      const rowGroup = new FormGroup({});
      this.form.push(rowGroup);

      const rowData = dataRows[rowIdx] || [];
      for(let colIdx = 0; colIdx < rowData.length; colIdx++) {
        const initialValue = rowData[colIdx] || '';
        rowGroup.addControl(`col-${colIdx}`, new FormControl(initialValue));
      }
    }
  }

  get headers(): string[] | null {
    if(this.data && this.data.headers) {
      return this.data.headers;
    }
    return null;
  }

  get formRows(): FormGroup[] {
    return this.form && this.form.controls ? this.form.controls as FormGroup[] : [];
  }

  formControls(formGroup: FormGroup): FormControl[] {
    return Object.values(formGroup.controls) as FormControl[];
  }
}
