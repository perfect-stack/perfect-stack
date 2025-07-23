
export class DataImportError {
  row: number;
  column: number;
  message: string;
}


export class DataImportModel {

  headers: string[];
  dataRows: string[][];

  errors: DataImportError[];
}