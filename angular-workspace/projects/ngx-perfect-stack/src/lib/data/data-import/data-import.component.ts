import {Component, effect, Injector, viewChild} from '@angular/core';
import {UploadPanelComponent} from "./upload-panel/upload-panel.component";
import {FormArray, FormControl, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {DataImportModel, DataImportResult} from "./upload-panel/data-import.model";
import {NgbTooltip} from "@ng-bootstrap/ng-bootstrap";
import {DataImportService} from "./data-import.service";

@Component({
  selector: 'lib-data-import',
  imports: [
    UploadPanelComponent,
    ReactiveFormsModule,
    NgbTooltip
  ],
  templateUrl: './data-import.component.html',
  styleUrl: './data-import.component.css'
})
export class DataImportComponent {

  uploadPanel = viewChild(UploadPanelComponent);

  data: DataImportModel | null;
  form: FormArray;

  dataImportResult: DataImportResult | null;

  constructor(
    protected readonly dataImportService: DataImportService,
    private injector: Injector) {
    effect(() => {
      const  uploadPanel = this.uploadPanel();
      if(uploadPanel) {
        this.data = null;
        this.dataImportResult = null;

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

  importHasErrors() {
    return this.data && this.data.errors && this.data.errors.length > 0;
  }

  findErrors(rowIdx: number, colIdx: number) {
    const errors = [];
    if(this.data && this.data.errors) {
      for(const nextError of this.data.errors) {
        if(nextError.row === rowIdx && nextError.col === colIdx) {
          errors.push(nextError);
        }
      }
    }

    return errors.length > 0 ? errors : null;
  }

  findErrorMessages(rowIdx: number, colIdx: number): string[] {
    const errors = this.findErrors(rowIdx, colIdx);
    if(errors && errors.length > 0) {
      return errors.map(nextError => nextError.message);
    }
    return [];
  }

  findErrorMessagesAsTooltip(rowIdx: number, colIdx: number): string {
    const errorMessages = this.findErrorMessages(rowIdx, colIdx);
    return errorMessages && errorMessages.length > 0 ? errorMessages.join(' ') : '';
  }

  onImportData() {
    if(this.data && this.data.errors.length === 0) {
      this.dataImportService.importData(this.data).subscribe(result => {
        console.log('Got result:', result);
        this.dataImportResult = result;
      });
    }
  }
}
