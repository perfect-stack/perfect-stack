
export class DataImportError {
  row: number;
  col: number;
  message: string;
}

/**
 * This is the "raw" data without any modifications needed to import the data so that the user does not get confused
 * about what they have and what they see. The errors will come through from the converted data model.
 */
export class DataImportModel {

  headers: string[];
  dataRows: string[][];

  errors: DataImportError[] = [];
}

export class DataImportResult {
  rowSuccessCount: number;
  errors: DataImportError[] = [];
}