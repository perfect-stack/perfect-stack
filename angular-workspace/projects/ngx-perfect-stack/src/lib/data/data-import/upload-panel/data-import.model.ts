
export class DataImportError {
  row: number;
  col: number;
  message: string;
}


export class DataImportModel {
  headers: string[];
  skipRows: boolean[];
  dataRows: string[][];

  importedRowCount: number;
  errors: DataImportError[];
}

export class DataImportResult {
  rowSuccessCount: number = 0;
  importedEntityList: string[];
  errors: DataImportError[] = [];
}
