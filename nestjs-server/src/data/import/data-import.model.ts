
export class DataImportError {
    row: number;
    col: number;
    message: string;
}


export class DataImportModel {
    status: "loaded" | "validated" | "imported" | "error";
    headers: string[];
    skipRows: boolean[];
    dataRows: string[][];

    importedRowCount: number;
    processedRowCount: number;

    rowSuccessCount: number = 0;
    importedEntityList: string[];

    errors: DataImportError[];
}

