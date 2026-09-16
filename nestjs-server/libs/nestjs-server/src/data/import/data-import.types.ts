import {Entity} from "../../domain/entity";
import {DataImportError} from "./data-import.model";
import {DataImportConverter, DataListImportConverter} from "./converter/converter.types";
import {CheckForDuplicates, DuplicateCheckAction, DuplicateCheckResult, PostImportActions} from "./data-import.service";

export type CreateEntityResponse = {
    entity: Entity;
    duplicateCheckResult: DuplicateCheckResult;
    duplicateCheckAction: DuplicateCheckAction;
    dataImportErrors: DataImportError[];
}

export type DataImportClientMapping = {
    title: string;
    metaEntityName: string;
}

export type DataImportMapping = {
    title: string;
    metaEntityName: string;
    duplicateCheck: CheckForDuplicates | null;
    postImportActions: PostImportActions | null;
    attributeMappings: DataAttributeMapping[];
}

export class DataAttributeMapping {
    columnName?: string | string[];
    attributeName?: string;
    indicatesBlankRow?: boolean;
    converter?: DataImportConverter | DataListImportConverter;
    defaultValue?: string | number | [];

    /**
     * Safely returns the columnName(s) as a string array, regardless of whether the
     * source is a single string, an array, or undefined.
     * @returns A string array of column names.
     */
    getColumnNamesAsArray(): string[] {
        if (!this.columnName) {
            return [];
        }
        return Array.isArray(this.columnName) ? this.columnName : [this.columnName];
    }
}
