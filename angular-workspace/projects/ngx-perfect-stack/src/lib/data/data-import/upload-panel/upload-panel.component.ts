import {ChangeDetectorRef, Component, effect, Inject, Injector, input, OnDestroy, OnInit, signal, TemplateRef} from '@angular/core';

import {NgbModal, NgbProgressbar} from "@ng-bootstrap/ng-bootstrap";
import {NgxPerfectStackConfig, STACK_CONFIG} from "../../../ngx-perfect-stack-config";
import {HttpClient, HttpEventType} from "@angular/common/http";
import {finalize, Subscription} from "rxjs";
import {Job} from "../../../job/job.model";
import {FormsModule} from "@angular/forms";
import {DataImportService} from "../data-import.service";
import {DataImportClientMapping, DataImportModel, DataImportParameter} from "./data-import.model";
import {DataService} from "../../data-service/data.service";

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
    NgbProgressbar,
    FormsModule
],
  templateUrl: './upload-panel.component.html',
  styleUrl: './upload-panel.component.css'
})
export class UploadPanelComponent implements OnInit, OnDestroy {
  job = input<Job | null>(null);
  dataImportModel = input<DataImportModel | null>(null);

  fileItems: FileItem[] = [];
  isDraggingOver = false;

  clientMappings: DataImportClientMapping[] = [];
  dataFormat = "Place";
  selectedMapping: DataImportClientMapping | null = null;

  // Generic dynamic parameter values and entity options
  parameterValues: Record<string, any> = {};
  parameterEntityOptions: Record<string, any[]> = {};

  schemaErrors: string[] = [];
  isValidatingSchema = false;

  uploadedData = signal<null | Job>(null);

  private hadLoadedJob = false;
  private appliedJobKey: string | null = null;

  constructor(@Inject(STACK_CONFIG)
              protected readonly stackConfig: NgxPerfectStackConfig,
              protected readonly dataImportService: DataImportService,
              protected readonly dataService: DataService,
              protected readonly modalService: NgbModal,
              private http: HttpClient,
              private injector: Injector,
              protected readonly cdr: ChangeDetectorRef) {
    effect(() => {
      const job = this.job();
      const data = this.dataImportModel();
      if (job || data) {
        this.hadLoadedJob = true;
        this.syncFromLoadedJob();
      } else if (this.hadLoadedJob) {
        this.hadLoadedJob = false;
        this.appliedJobKey = null;
        this.fileItems = [];
        this.uploadedData.set(null);
        if (this.clientMappings.length > 0) {
          this.selectMapping(this.clientMappings[0]);
        }
        this.cdr.markForCheck();
      }
    }, {injector: this.injector});
  }

  get hasUploadedFile(): boolean {
    return !!(
      this.job() ||
      this.dataImportModel() ||
      this.fileItems.some(item => item.status === 'loading' || item.status === 'success')
    );
  }

  get uploadedFilename(): string {
    const liveItem = this.fileItems.find(item => item.status === 'loading' || item.status === 'success');
    if (liveItem) {
      return liveItem.file.name;
    }
    return this.dataImportModel()?.filename || this.job()?.filename || '';
  }

  hasMappingForFormat(title: string): boolean {
    return this.clientMappings.some(m => m.title === title);
  }

  ngOnInit(): void {
    this.dataImportService.getDataImportClientMapping().subscribe(mappings => {
      this.clientMappings = mappings || [];
      if (this.clientMappings.length > 0) {
        if (this.job() || this.dataImportModel()) {
          this.syncFromLoadedJob();
        } else {
          const current = this.clientMappings.find(m => m.title === this.dataFormat) || this.clientMappings[0];
          this.selectMapping(current);
        }
      }
      this.cdr.markForCheck();
    });
  }

  private syncFromLoadedJob(): void {
    const job = this.job();
    const data = this.dataImportModel();
    if (!job && !data) {
      return;
    }

    const targetFormat = data?.dataFormat || job?.data_format;
    const targetParams = data?.parameters || {};
    const jobKey = `${job?.id || ''}|${targetFormat || ''}|${JSON.stringify(targetParams)}`;
    if (this.appliedJobKey === jobKey) {
      return;
    }

    if (this.clientMappings.length === 0) {
      if (targetFormat) {
        this.dataFormat = targetFormat;
      }
      return;
    }

    if (targetFormat) {
      const found = this.clientMappings.find(m => m.title === targetFormat);
      if (found) {
        this.selectMapping(found, targetParams, false);
      } else {
        this.dataFormat = targetFormat;
        this.selectedMapping = null;
        this.parameterValues = { ...targetParams };
      }
    }

    this.appliedJobKey = jobKey;
    this.cdr.markForCheck();
  }

  hasCategories(): boolean {
    return this.clientMappings.some(m => !!m.category);
  }

  getCategories(): string[] {
    const set = new Set<string>();
    for (const m of this.clientMappings) {
      set.add(m.category || 'Predefined');
    }
    return Array.from(set);
  }

  getMappingsByCategory(category: string): DataImportClientMapping[] {
    return this.clientMappings.filter(m => (m.category || 'Predefined') === category);
  }

  onFormatTitleChange(newTitle: string): void {
    const found = this.clientMappings.find(m => m.title === newTitle);
    if (found) {
      this.selectMapping(found);
    }
  }

  selectMapping(mapping: DataImportClientMapping, initialParams?: Record<string, any>, runSchemaCheck = true): void {
    this.selectedMapping = mapping;
    this.dataFormat = mapping.title;
    this.parameterValues = {};
    this.schemaErrors = [];

    if (mapping.parameters && mapping.parameters.length > 0) {
      for (const param of mapping.parameters) {
        if (initialParams && initialParams[param.name] !== undefined && initialParams[param.name] !== null) {
          this.parameterValues[param.name] = initialParams[param.name];
        } else if (param.defaultValue !== undefined) {
          this.parameterValues[param.name] = param.defaultValue;
        } else {
          this.parameterValues[param.name] = null;
        }
        if (param.type === 'entity-select' && param.entityName) {
          this.loadEntityOptions(param);
        }
      }
    }
    if (runSchemaCheck) {
      this.checkSchemaIfReady();
    }
    this.cdr.markForCheck();
  }

  loadEntityOptions(param: DataImportParameter): void {
    if (!param.entityName || this.parameterEntityOptions[param.name]) {
      return;
    }
    this.dataService.findAll(param.entityName, '', 1, 500).subscribe({
      next: (response) => {
        if (response && response.resultList) {
          const displayProp = param.displayField || 'name';
          this.parameterEntityOptions[param.name] = response.resultList.sort((a: any, b: any) =>
            String(a[displayProp] || '').localeCompare(String(b[displayProp] || ''))
          );
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error(`Failed to load options for entity parameter ${param.name} (${param.entityName})`, err);
      }
    });
  }

  getParamOptionLabel(param: DataImportParameter, item: any): string {
    const display = item[param.displayField || 'name'] || '';
    const secondary = param.secondaryDisplayField ? item[param.secondaryDisplayField] : null;
    return secondary ? `${display} (${secondary})` : display;
  }

  onParameterChange(param: DataImportParameter): void {
    this.checkSchemaIfReady();
    this.cdr.markForCheck();
  }

  checkSchemaIfReady(): void {
    this.schemaErrors = [];
    if (!this.selectedMapping || !this.selectedMapping.supportsSchemaCheck) {
      return;
    }
    const hasAllRequired = !(this.selectedMapping.parameters || []).some(
      p => p.required && (this.parameterValues[p.name] === undefined || this.parameterValues[p.name] === null || this.parameterValues[p.name] === '')
    );
    if (!hasAllRequired) {
      return;
    }

    this.isValidatingSchema = true;
    this.dataImportService.checkSchema(this.selectedMapping.title, this.parameterValues).subscribe({
      next: (result) => {
        this.isValidatingSchema = false;
        if (!result.valid && result.errors && result.errors.length > 0) {
          this.schemaErrors = result.errors;
        } else {
          this.schemaErrors = [];
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isValidatingSchema = false;
        console.error('Failed to validate schema for format', err);
        this.cdr.markForCheck();
      }
    });
  }

  isUploadDisabled(): boolean {
    if (this.hasUploadedFile) {
      return true;
    }
    if (this.isValidatingSchema || this.schemaErrors.length > 0) {
      return true;
    }
    if (!this.selectedMapping || !this.selectedMapping.parameters) {
      return false;
    }
    return this.selectedMapping.parameters.some(p => p.required && !this.parameterValues[p.name]);
  }

  getMissingRequiredParameterLabel(): string {
    if (!this.selectedMapping || !this.selectedMapping.parameters) {
      return '';
    }
    const missing = this.selectedMapping.parameters.find(p => p.required && !this.parameterValues[p.name]);
    return missing ? missing.label : '';
  }

  canDownloadTemplates(): boolean {
    if (!this.selectedMapping || !this.selectedMapping.supportsTemplates) {
      return false;
    }
    if (this.schemaErrors.length > 0) {
      return false;
    }
    if (this.selectedMapping.parameters) {
      return !this.selectedMapping.parameters.some(p => p.required && !this.parameterValues[p.name]);
    }
    return true;
  }

  isDownloadingTemplate = false;
  isLoadingDictionary = false;
  dictionaryError: string | null = null;
  dictionaryHeaders: string[] = [];
  dictionaryRows: string[][] = [];
  dictionaryFilter = '';

  get dictionarySubtitle(): string {
    if (!this.selectedMapping) {
      return '';
    }
    const parts: string[] = [this.selectedMapping.title];
    if (this.selectedMapping.parameters) {
      for (const p of this.selectedMapping.parameters) {
        const val = this.parameterValues[p.name];
        if (val !== undefined && val !== null && val !== '') {
          const options = this.parameterEntityOptions[p.name];
          const opt = options?.find((o: any) => o.id === val);
          const displayVal = opt ? this.getParamOptionLabel(p, opt) : val;
          parts.push(`${p.label}: ${displayVal}`);
        }
      }
    }
    return parts.join(' — ');
  }

  get filteredDictionaryRows(): string[][] {
    const query = this.dictionaryFilter.trim().toLowerCase();
    if (!query) {
      return this.dictionaryRows;
    }
    return this.dictionaryRows.filter(row =>
      row.some(cell => (cell || '').toLowerCase().includes(query))
    );
  }

  viewDataDictionary(modalTemplate: TemplateRef<any>): void {
    if (!this.selectedMapping || !this.canDownloadTemplates()) {
      return;
    }

    this.isLoadingDictionary = true;
    this.dictionaryError = null;
    this.dictionaryHeaders = [];
    this.dictionaryRows = [];
    this.dictionaryFilter = '';

    this.modalService.open(modalTemplate, { size: 'xl', scrollable: true });

    this.dataImportService.downloadTemplate(this.selectedMapping.title, this.parameterValues, 'dictionary').subscribe({
      next: (response) => {
        const blob = response.body;
        if (!blob) {
          this.dictionaryError = 'No data dictionary content was returned.';
          this.isLoadingDictionary = false;
          this.cdr.markForCheck();
          return;
        }

        blob.text().then(csvText => {
          const parsed = this.parseCsv(csvText);
          if (parsed.length > 0) {
            this.dictionaryHeaders = parsed[0];
            const columnCount = this.dictionaryHeaders.length;
            this.dictionaryRows = parsed.slice(1).map(row => {
              if (row.length === columnCount) {
                return row;
              }
              return Array.from({ length: columnCount }, (_, idx) => row[idx] ?? '');
            });
          }
          this.isLoadingDictionary = false;
          this.cdr.markForCheck();
        }).catch(err => {
          console.error('Failed to read data dictionary text', err);
          this.dictionaryError = 'Failed to parse data dictionary content.';
          this.isLoadingDictionary = false;
          this.cdr.markForCheck();
        });
      },
      error: (err) => {
        console.error('Failed to load data dictionary', err);
        this.dictionaryError = 'Failed to load data dictionary.';
        this.isLoadingDictionary = false;
        this.cdr.markForCheck();
      }
    });
  }

  private parseCsv(csvText: string): string[][] {
    const rows: string[][] = [];
    const text = csvText.replace(/^\uFEFF/, '');
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (inQuotes) {
        if (char === '"' && nextChar === '"') {
          currentField += '"';
          i++;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          currentField += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          currentRow.push(currentField);
          currentField = '';
        } else if (char === '\r' || char === '\n') {
          if (char === '\r' && nextChar === '\n') {
            i++;
          }
          currentRow.push(currentField);
          if (currentRow.some(cell => cell !== '') || currentRow.length > 1) {
            rows.push(currentRow);
          }
          currentRow = [];
          currentField = '';
        } else {
          currentField += char;
        }
      }
    }

    if (currentField !== '' || currentRow.length > 0) {
      currentRow.push(currentField);
      if (currentRow.some(cell => cell !== '') || currentRow.length > 1) {
        rows.push(currentRow);
      }
    }

    return rows;
  }

  downloadTemplate(flavour: 'grid' | 'dictionary'): void {
    if (!this.selectedMapping || !this.canDownloadTemplates()) {
      return;
    }
    this.isDownloadingTemplate = true;
    this.dataImportService.downloadTemplate(this.selectedMapping.title, this.parameterValues, flavour).subscribe({
      next: (response) => {
        this.isDownloadingTemplate = false;
        const blob = response.body;
        if (!blob) return;

        let filename = '';
        const disposition = response.headers.get('content-disposition');
        if (disposition) {
          const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (match && match[1]) {
            filename = match[1].replace(/['"]/g, '').trim();
          }
        }

        if (!filename) {
          const entity = this.selectedMapping?.metaEntityName || this.selectedMapping?.title || 'Data';
          let methodPart = '';
          if (this.selectedMapping?.parameters) {
            for (const p of this.selectedMapping.parameters) {
              const val = this.parameterValues[p.name];
              if (val) {
                const options = this.parameterEntityOptions[p.name];
                const opt = options?.find((o: any) => o.id === val);
                const displayVal = opt ? (opt[p.displayField || 'name'] || opt.name || val) : val;
                methodPart = `_${String(displayVal).trim().replace(/[^a-zA-Z0-9_\-]+/g, '_')}`;
                break;
              }
            }
          }
          const suffix = flavour === 'grid' ? 'Template.csv' : 'Data_Dictionary.csv';
          filename = `${entity}${methodPart}_${suffix}`;
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isDownloadingTemplate = false;
        console.error('Failed to download template', err);
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy(): void {
    this.fileItems.forEach(item => item.uploadSub?.unsubscribe())
  }

  // --- Drag and Drop Handlers ---

  onDragOver(event: DragEvent) {
    if (this.isUploadDisabled()) return;
    event.preventDefault(); // Prevent default browser behavior
    event.stopPropagation(); // Stop event bubbling
    this.isDraggingOver = true; // Activate visual feedback
    this.cdr.markForCheck();
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver = false; // Deactivate visual feedback
    this.cdr.markForCheck();
  }

  onDrop(event: DragEvent) {
    if (this.isUploadDisabled()) return;
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver = false; // Deactivate visual feedback
    this.cdr.markForCheck();

    const files = event.dataTransfer?.files; // Get files from the drop event
    if (files && files.length > 0) {
      this.processFiles(files); // Process the dropped files
    }
  }

  // --- File Selection Handler ---

  onFileSelected(event: Event): void {
    if (this.isUploadDisabled()) return;
    const element = event.currentTarget as HTMLInputElement;
    const files: FileList | null = element.files;
    if (files && files.length > 0) {
      this.processFiles(files); // Process selected files
      element.value = ''; // Reset input value to allow selecting the same file again
    }
  }

  // --- Common File Processing Logic ---

  processFiles(files: FileList): void {
    if (this.isUploadDisabled()) {
      return;
    }
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
      this.cdr.markForCheck();
      this.upload(nextFileItem); // Start upload processing for this item
    }
  }

  upload(fileItem: FileItem): void {
    const uploadUrl = `${this.stackConfig.apiUrl}/job/data-import/upload`;

    // 1. Create a FormData object to build the multipart request
    const formData = new FormData();

    // 2. Append the file and format parameters
    formData.append('file', fileItem.file, fileItem.file.name);
    formData.append('dataFormat', this.dataFormat);

    // Generic parameter propagation
    for (const [key, value] of Object.entries(this.parameterValues)) {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value);
        formData.append(`params[${key}]`, value);
      }
    }

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
          this.cdr.markForCheck();
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
          this.cdr.markForCheck();
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
        this.cdr.markForCheck();
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
      this.cdr.markForCheck();
    }
  }

}
