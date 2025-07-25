import {Entity} from "../../domain/entity";
import {DataImportError} from "./data-import.model";
import {DataImportConverter} from "./converter/converter.types";

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
    attributeName?: string;
    converter?: DataImportConverter
    defaultValue?: string;
}
