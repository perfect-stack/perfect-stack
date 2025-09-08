
export class DataImportError {
  row: number;
  cols: number[];
  message: string;
}


export class DataImportModel {
  status: "loaded" | "validated" | "imported" | "error";
  dataFormat: string;
  headers: string[];
  skipRows: boolean[];
  dataRows: string[][];

  importedRowCount: number;
  processedRowCount: number;

  rowSuccessCount: number = 0;
  importedEntityList: string[];

  errors: DataImportError[];
}

