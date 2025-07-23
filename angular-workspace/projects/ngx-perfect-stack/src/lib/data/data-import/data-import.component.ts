import {Component, effect, Injector, viewChild} from '@angular/core';
import {UploadPanelComponent} from "./upload-panel/upload-panel.component";
import {JsonPipe} from "@angular/common";
import {AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule} from "@angular/forms";

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

  data: any;
  form: FormArray;


  constructor(private injector: Injector) {
    effect(() => {
      const  uploadPanel = this.uploadPanel();
      if(uploadPanel) {
        const  uploadedData = uploadPanel.uploadedData();
        console.log('Data Import - uploadedData: ', uploadedData);
        this.data = uploadedData.data;
        this.createForm(this.data);
      }
    }, {injector: this.injector});
  }

  private createForm(data: string[][]) {
    this.form = new FormArray<FormGroup>([]);
    for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
      const rowGroup = new FormGroup({});
      this.form.push(rowGroup);

      const rowData = data[rowIdx] || [];
      for(let colIdx = 0; colIdx < rowData.length; colIdx++) {
        const initialValue = rowData[colIdx] || '';
        rowGroup.addControl(`col-${colIdx}`, new FormControl(initialValue));
      }
    }
  }

  /**
   * Returns the first row of the form, intended for the table header.
   * @returns The first FormGroup or null if the form is empty.
   */
  get headerRow(): FormGroup | null {
    if (this.form && this.form.length > 0) {
      return this.form.at(0) as FormGroup;
    }
    return null;
  }

  /**
   * Returns all data rows of the form (all except the first/header row).
   * @returns An array of FormGroups for the table body.
   */
  get formRows(): FormGroup[] {
    if (this.form && this.form.length > 1) {
      // .slice(1) creates a new array containing all elements from index 1 onwards.
      return this.form.controls.slice(1) as FormGroup[];
    }
    return []; // Return an empty array if there are no data rows.
  }

  formControls(formGroup: FormGroup): FormControl[] {
    return Object.values(formGroup.controls) as FormControl[];
  }
}
