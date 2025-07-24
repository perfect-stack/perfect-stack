import {Entity} from "../../domain/entity";
import {DataImportError} from "./data-import.model";

export class AttributeValue {
    name: string;
    value: string;
    error?: string;
}

export class ConverterResult {
    col?: number = 0;
    attributeValues: AttributeValue[];
}

export class DataImportConverter {
    // string, date, number, codetable, band_number
    toAttributeValue(attributeName: string, externalValue: string): ConverterResult {
        // might need to return more than one value e.g. band_number needs a lookup to get bird_id
        return;
    }
}

export class CreateEntityResponse {
    entity: Entity;
    dataImportErrors: DataImportError[];
}

export class DataImportMapping {
    metaEntityName: string;
    attributeMappings: DataAttributeMapping[];
}

export class DataAttributeMapping {
    columnName?: string;
    attributeName: string;
    converter?: DataImportConverter
    defaultValue?: string;
}
