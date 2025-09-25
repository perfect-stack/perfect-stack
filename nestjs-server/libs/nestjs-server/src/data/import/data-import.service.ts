import {Injectable} from "@nestjs/common";
import {DataImportError, DataImportModel} from "./data-import.model";
import {CreateEntityResponse, DataAttributeMapping, DataImportMapping} from "./data-import.types";
import {Entity} from "../../domain/entity";
import {
    ConverterResult,
    DataImportConverter,
    DataListImportConverter,
    ExternalValue
} from "./converter/converter.types";
import {QueryService} from "../query.service";
import {DataService} from "../data.service";
import {ValidationService} from "../validation.service";
import {ValidationResult, ValidationResultMapController} from "../../domain/meta.rule";
import {MetaEntity} from "../../domain/meta.entity";
import {MetaEntityService} from "../../meta/meta-entity/meta-entity.service";
import {DataFormatService} from "@perfect-stack/nestjs-server/data/import/data-format.service";

export enum DuplicateCheckAction {
    NOT_A_DUPLICATE,
    DUPLICATE_IN_FILE_IGNORE,
    DUPLICATE_IN_DB_IGNORE,
    DUPLICATE_IN_FILE_ERROR,
    DUPLICATE_IN_DB_ERROR,
    UNABLE_TO_DETERMINE
}

export interface CheckForDuplicates {
    checkForDuplicates(entity: Entity, importSet: string[]): Promise<DuplicateCheckAction>;
}

export interface PostImportActions {
    postImport(entity: Entity): Promise<void>;
}


@Injectable()
export class DataImportService {


    constructor(protected readonly queryService: QueryService,
                protected readonly dataService: DataService,
                protected readonly dataFormatService: DataFormatService,
                protected readonly metaEntityService: MetaEntityService,
                protected readonly validationService: ValidationService) {
    }


    async dataImportValidate(stepIndex: number, dataImportModel: DataImportModel) {

        if(stepIndex === 0) {
            dataImportModel.skipRows = [];
            dataImportModel.errors = [];
            dataImportModel.importedEntityList = [];
            dataImportModel.duplicateCheckList = [];

            dataImportModel.skipRowCount = 0;
            dataImportModel.errorRowCount = 0;
            dataImportModel.validRowCount = 0;
            dataImportModel.totalRowCount = dataImportModel.dataRows.length;
        }

        const dataImportMapping = await this.findDataImportMapping(dataImportModel.dataFormat);
        const nextRow = dataImportModel.dataRows[stepIndex];

        if (this.isBlankRow(dataImportModel.headers, nextRow, dataImportMapping)) {
            dataImportModel.skipRowCount = dataImportModel.skipRowCount + 1;
            dataImportModel.skipRows.push("Blank");
        }
        else {
            const createEntityResponse = await this.createEntity(dataImportMapping, dataImportModel.headers, nextRow, stepIndex, dataImportModel.duplicateCheckList);
            dataImportModel.errors.push(...createEntityResponse.dataImportErrors)

            if(createEntityResponse.duplicateCheckAction === DuplicateCheckAction.DUPLICATE_IN_FILE_IGNORE) {
                dataImportModel.skipRowCount = dataImportModel.skipRowCount + 1;
                dataImportModel.skipRows.push('Duplicate');
            }
            else {
                const validationResultMapController = await this.validate(dataImportMapping.metaEntityName, createEntityResponse.entity);
                if (validationResultMapController.hasErrors()) {
                    this.addErrors(validationResultMapController, stepIndex, dataImportModel, dataImportMapping, nextRow, createEntityResponse.entity);
                    dataImportModel.errorRowCount = dataImportModel.errorRowCount + 1;
                    dataImportModel.skipRows.push("Processed");
                }
                else {
                    if(createEntityResponse.duplicateCheckAction === DuplicateCheckAction.DUPLICATE_IN_DB_ERROR) {
                        dataImportModel.errorRowCount = dataImportModel.errorRowCount + 1;
                        dataImportModel.skipRows.push("Processed");
                    }
                    else {
                        dataImportModel.validRowCount = dataImportModel.validRowCount + 1;
                        dataImportModel.skipRows.push("Processed");
                    }
                }
            }
        }
    }



    async dataImportImport(stepIndex: number, dataImportModel: DataImportModel) {

        if(stepIndex === 0) {
            dataImportModel.skipRows = [];
            dataImportModel.errors = [];
            dataImportModel.importedEntityList = [];
            dataImportModel.duplicateCheckList = [];

            dataImportModel.skipRowCount = 0;
            dataImportModel.errorRowCount = 0;
            dataImportModel.validRowCount = 0;
            dataImportModel.totalRowCount = dataImportModel.dataRows.length;
        }

        const dataImportMapping = await this.findDataImportMapping(dataImportModel.dataFormat);
        const nextRow = dataImportModel.dataRows[stepIndex];

        if (this.isBlankRow(dataImportModel.headers, nextRow, dataImportMapping)) {
            dataImportModel.skipRowCount = dataImportModel.skipRowCount + 1;
            dataImportModel.skipRows.push("Blank");
            dataImportModel.importedEntityList.push(null);
        }
        else {
            const createEntityResponse = await this.createEntity(dataImportMapping, dataImportModel.headers, nextRow, stepIndex, dataImportModel.duplicateCheckList);
            dataImportModel.errors.push(...createEntityResponse.dataImportErrors)

            if(createEntityResponse.duplicateCheckAction === DuplicateCheckAction.DUPLICATE_IN_FILE_IGNORE) {
                dataImportModel.skipRowCount = dataImportModel.skipRowCount + 1;
                dataImportModel.skipRows.push('Duplicate');
                dataImportModel.importedEntityList.push(null);
            }
            else {
                const validationResultMapController = await this.validate(dataImportMapping.metaEntityName, createEntityResponse.entity);
                if (validationResultMapController.hasErrors()) {
                    this.addErrors(validationResultMapController, stepIndex, dataImportModel, dataImportMapping, nextRow, createEntityResponse.entity);
                    dataImportModel.errorRowCount = dataImportModel.errorRowCount + 1;
                    dataImportModel.skipRows.push("Processed");
                    dataImportModel.importedEntityList.push(null);
                }
                else {
                    const entityResponse = await this.dataService.save(dataImportMapping.metaEntityName, createEntityResponse.entity);
                    if (entityResponse) {
                        const entityResultMapController = new ValidationResultMapController(entityResponse.validationResults);
                        if (entityResultMapController.hasErrors()) {
                            throw new Error('Attempted save, but it failed with new errors');
                        }
                        else {
                            dataImportModel.validRowCount = dataImportModel.validRowCount + 1;
                            dataImportModel.skipRows.push("Processed");
                            dataImportModel.importedEntityList.push(entityResponse.entity.id);

                            if (dataImportMapping.postImportActions) {
                                await dataImportMapping.postImportActions.postImport(entityResponse.entity);
                            }
                        }
                    }
                    else {
                        throw new Error('Attempted save, but no response returned');
                    }
                }
            }
        }
    }

    addErrors(validationResultMapController: ValidationResultMapController,
              stepIndex: number,
              dataImportModel: DataImportModel,
              dataImportMapping: DataImportMapping,
              dataRow: string[] | null,
              entity: Entity
        ) {

        if(validationResultMapController.hasErrors()) {

            // Add the validation errors to the dataImportModel
            const validationErrors = validationResultMapController.validationResultMap;
            for(const nextErrorKey of Object.keys(validationErrors)) {
                const nextError = validationErrors[nextErrorKey];
                dataImportModel.errors.push(this.toDataImportError(nextError, stepIndex, dataImportModel.headers, dataImportMapping));
            }

            console.log('IMPORT ERRORS: ');
            console.log(' Data:   ' + JSON.stringify(dataRow))
            console.log(' Entity: ' + JSON.stringify(entity));
            for(const nextErrorKey of Object.keys(validationResultMapController.validationResultMap)) {
                const validationError = validationResultMapController.validationResultMap[nextErrorKey];
                console.log(` - Error: ${nextErrorKey}: ${validationError.message}`);
            }
        }
        else {
            console.log('IMPORT GOOD: ');
            console.log(' Data:   ' + JSON.stringify(dataRow))
            console.log(' Entity: ' + JSON.stringify(entity));
        }
    }

    toDataImportError(validationResult: ValidationResult,
                      rowIdx: number,
                      headers: string[],
                      dataImportMapping: DataImportMapping): DataImportError {

        const attributeMapping = dataImportMapping.attributeMappings.find(mapping => {
            mapping.getColumnNamesAsArray().includes(validationResult.name)
        });

        const columnIndices: number[] = attributeMapping ?
            this.findColumnIndices(attributeMapping.getColumnNamesAsArray(), headers)
            : [0];

        return {
            row: rowIdx,
            cols: columnIndices,
            message: validationResult.message + ` [${validationResult.name}]`
        };
    }

    async validate(entityName: string, entity: any): Promise<ValidationResultMapController> {
        const metaEntityList = await this.metaEntityService.findAll();
        const metaEntityMap = new Map<string, MetaEntity>();
        for (const nextMetaEntity of metaEntityList) {
            metaEntityMap.set(nextMetaEntity.name, nextMetaEntity);
        }

        const metaEntity = metaEntityMap.get(entityName);
        if (!metaEntity) {
            throw new Error(`Unable to find MetaEntity ${entityName}`);
        }

        return await this.validationService.validate(metaEntityMap, metaEntity, entity);
    }

    isBlankRow(headers: string[], dataRow: string[], dataImportMapping: DataImportMapping) {
        // return true if the "Imported" fields in the dataRow are null, empty, or undefined
        // - we don't care about the fields that we are not importing
        for(const nextAttributeMapping of dataImportMapping.attributeMappings) {
            if(nextAttributeMapping.columnName && nextAttributeMapping.indicatesBlankRow) {
                for(const nextColumName of nextAttributeMapping.getColumnNamesAsArray()) {
                    const colIdx = headers.indexOf(nextColumName);
                    if (colIdx >= 0) {
                        const colValue = dataRow[colIdx];
                        if (colValue !== null && colValue !== '' && typeof colValue !== 'undefined') {
                            return false;
                        }
                    }
                }
            }
        }

        return true;
    }

    async createEntity(dataImportMapping: DataImportMapping, headers: string[], dataRow: string[], rowIdx: number, duplicateCheckList: string[]): Promise<CreateEntityResponse> {

        // create an entity for this data row
        const entity: Entity = {
            id: null
        };

        const dataImportErrors: DataImportError[] = [];

        // for each data mapping
        for(const nextAttributeMapping of dataImportMapping.attributeMappings) {
            let converterResult: ConverterResult;
            //if nextAttributeMapping.columnName is an array of string
            if(nextAttributeMapping.columnName && Array.isArray(nextAttributeMapping.columnName)) {
                converterResult = await this.convertDataListExternalValue(nextAttributeMapping, headers, dataRow);
            }
            else if(nextAttributeMapping.columnName) {
                converterResult = await this.convertExternalValue(nextAttributeMapping, headers, dataRow);
            }
            else if(nextAttributeMapping.defaultValue) {
                converterResult = this.convertDefaultValue(nextAttributeMapping);
            }
            else {
                throw new Error(`Invalid mapping. No columnName OR default value supplied for ${nextAttributeMapping.attributeName}`);
            }

            // Add the converted results to the entity
            for(const nextAttributeValue of converterResult.attributeValues) {
                entity[nextAttributeValue.name] = nextAttributeValue.value;
                if(nextAttributeValue.error) {
                    dataImportErrors.push({
                        row: rowIdx,
                        cols: this.findColumnIndices(nextAttributeMapping.getColumnNamesAsArray(), headers),
                        message: nextAttributeValue.error
                    });
                }
            }
        }

        // Check for duplicates (but only if no errors)
        let duplicateCheckAction = DuplicateCheckAction.UNABLE_TO_DETERMINE;
        if(dataImportErrors.length === 0) {
            duplicateCheckAction = await dataImportMapping.duplicateCheck.checkForDuplicates(entity, duplicateCheckList);

            switch (duplicateCheckAction) {
                case DuplicateCheckAction.NOT_A_DUPLICATE:
                case DuplicateCheckAction.DUPLICATE_IN_FILE_IGNORE:
                case DuplicateCheckAction.DUPLICATE_IN_DB_IGNORE:
                    // Do nothing
                    break;
                case DuplicateCheckAction.DUPLICATE_IN_FILE_ERROR:
                    dataImportErrors.push({
                        row: rowIdx,
                        cols: [0],
                        message: 'A duplicate in this file already exists - unable to import'
                    });
                    break;
                case DuplicateCheckAction.DUPLICATE_IN_DB_ERROR:
                    dataImportErrors.push({
                        row: rowIdx,
                        cols: [0],
                        message: 'A duplicate entity for this data already exists in the database - unable to import'
                    });
                    break;
                case DuplicateCheckAction.UNABLE_TO_DETERMINE:
                    dataImportErrors.push({
                        row: rowIdx,
                        cols: [0],
                        message: 'Unable to perform duplicate check - due to missing or invalid data'
                    });
                    break;
                default:
                    throw new Error('Unhandled duplicate action - needs work ');
            }
        }

        return {entity, duplicateCheckAction, dataImportErrors};
    }

    async convertDataListExternalValue(attributeMapping: DataAttributeMapping, headers: string[], dataRow: string[]) {

        // The DataAttributeMapping can define a list of column names in any order (column B might be listed before column A)
        // so that when the values are extracted and passed down to the converter, the converter can then rely on ordinal
        // position of the value when doing the conversion. The mapping lists the order of the columns in the order the
        // converter needs, but that does not have to be the order in which they occur in the file.
        const externalValues: ExternalValue[] = this.findExternalValues(attributeMapping.columnName as string[], headers, dataRow);
        const converter = attributeMapping.converter as DataListImportConverter;
        const converterResult = await converter.toAttributeValueFromExternalValueList(attributeMapping.attributeName, externalValues);

        return converterResult;
    }

    async convertExternalValue(attributeMapping: DataAttributeMapping, headers: string[], dataRow: string[]) {
        // find the externalValue by single "columnName"
        const colIdx = headers.indexOf(attributeMapping.columnName as string);
        if(colIdx < 0) {
            throw new Error(`Unable to find column name ${attributeMapping.columnName} in file`);
        }

        const externalValue = dataRow[colIdx];
        const converter = attributeMapping.converter as DataImportConverter;
        const converterResult = await converter.toAttributeValue(attributeMapping.attributeName, externalValue);
        if(!converterResult) {
            // This error should never happen but probably will during development if Converter is not implemented
            throw new Error(`Unable to convert external value ${externalValue} for attribute ${attributeMapping.attributeName}`);
        }
        return converterResult;
    }


    convertDefaultValue(attributeMapping: DataAttributeMapping): ConverterResult {
        return {
            attributeValues: [{
                name: attributeMapping.attributeName,
                value: attributeMapping.defaultValue
            }]
        }
    }

    findColumnIndices(columnNames: string[], headers: string[]): number[] {
        const indices: number[] = [];
        for (const colName of columnNames) {
            const idx = headers.indexOf(colName);
            if (idx >= 0) {
                indices.push(idx);
            } else {
                // Handle case where column name is not found, e.g., throw an error or push a -1
                throw new Error(`Column '${colName}' not found in headers.`);
            }
        }
        return indices;
    }

    findExternalValues(columnNames: string[], headers: string[], dataRow: string[]): ExternalValue[] {
        const columnIndices = this.findColumnIndices(columnNames, headers);
        return columnIndices.map((colIdx, i) => ({
            name: columnNames[i],
            value: dataRow[colIdx],
            col: colIdx
        }));
    }


    async findDataImportMapping(dataFormat: string): Promise<DataImportMapping> {
        return this.dataFormatService.getDataFormat(dataFormat);
    }
}