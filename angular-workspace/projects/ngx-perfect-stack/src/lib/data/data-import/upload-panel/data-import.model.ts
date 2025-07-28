
export class DataImportError {
  row: number;
  col: number;
  message: string;
}


export class DataImportModel {

  headers: string[];
  dataRows: string[][];

  errors: DataImportError[];
}

export class DataImportResult {
  rowSuccessCount: number = 0;
  errors: DataImportError[] = [];
}
