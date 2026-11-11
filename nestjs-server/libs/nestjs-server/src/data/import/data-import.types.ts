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

export interface DataImportParameter {
    name: string;
    label: string;
    type: 'entity-select' | 'select' | 'text';
    entityName?: string;
    displayField?: string;
    secondaryDisplayField?: string;
    required?: boolean;
    defaultValue?: any;
    options?: { label: string; value: any }[];
}

export type DataImportClientMapping = {
    title: string;
    metaEntityName: string;
    category?: string;
    parameters?: DataImportParameter[];
    supportsTemplates?: boolean;
    supportsSchemaCheck?: boolean;
}

export interface TemplateResult {
    filename: string;
    contentType: string;
    content: string | Buffer;
}

export interface DynamicDataImportProvider {
    readonly formatKey: string;
    readonly metaEntityName: string;
    readonly category?: string;
    readonly supportsTemplates?: boolean;
    readonly supportsSchemaCheck?: boolean;
    getParameters(): DataImportParameter[];
    getMapping(params: Record<string, any>): Promise<DataImportMapping>;
    validateSchema?(params: Record<string, any>): Promise<{ valid: boolean; errors: string[] }>;
    generateTemplate?(params: Record<string, any>, flavour: 'grid' | 'dictionary'): Promise<TemplateResult>;
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
