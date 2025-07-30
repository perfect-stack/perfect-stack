import {Entity} from "../../domain/entity";
import {DataImportError} from "./data-import.model";
import {DataImportConverter} from "./converter/converter.types";
import {CheckForDuplicates} from "./data-import.service";

export class CreateEntityResponse {
    entity: Entity;
    dataImportErrors: DataImportError[];
}

export class DataImportMapping {
    metaEntityName: string;
    duplicateCheck: CheckForDuplicates;
    attributeMappings: DataAttributeMapping[];
}

export class DataAttributeMapping {
    columnName?: string;
    attributeName?: string;
    indicatesBlankRow?: boolean;
    converter?: DataImportConverter
    defaultValue?: string | number | [];
}
