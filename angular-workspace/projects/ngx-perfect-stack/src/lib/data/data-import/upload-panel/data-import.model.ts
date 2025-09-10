
export class DataImportError {
  row: number;
  cols: number[];
  message: string;
}

export type SkipReason = "Processed" | "Blank" | "Duplicate";

export class DataImportModel {
  status: "loaded" | "validated" | "imported" | "error";
  dataFormat: string;
  headers: string[];
  skipRows: SkipReason[];
  dataRows: string[][];

  importedRowCount: number;
  processedRowCount: number;

  rowSuccessCount: number = 0;
  importedEntityList: string[];

  // When checking for duplicates in the File being imported it was important to keep the data structures as
  // close to pure JSON as possible, so this duplicationCheckList could/should be a Set, but was kept as an
  // array of strings.
  duplicateCheckList: string[];
  errors: DataImportError[];
}

