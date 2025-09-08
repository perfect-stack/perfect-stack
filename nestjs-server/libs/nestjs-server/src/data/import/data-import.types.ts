import {Entity} from "../../domain/entity";
import {DataImportError} from "./data-import.model";
import {DataImportConverter, DataListImportConverter} from "./converter/converter.types";
import {CheckForDuplicates, PostImportActions} from "./data-import.service";

export class CreateEntityResponse {
    entity: Entity;
    dataImportErrors: DataImportError[];
}

export class DataImportMapping {
    metaEntityName: string;
    duplicateCheck: CheckForDuplicates;
    postImportActions: PostImportActions;
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
