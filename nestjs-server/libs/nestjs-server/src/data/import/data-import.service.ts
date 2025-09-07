import {Injectable} from "@nestjs/common";
import {DataImportError, DataImportModel} from "./data-import.model";
import {CreateEntityResponse, DataAttributeMapping, DataImportMapping} from "./data-import.types";
import {Entity} from "../../domain/entity";
import {ConverterResult} from "./converter/converter.types";
import {QueryService} from "../query.service";
import {DataService} from "../data.service";
import {ValidationService} from "../validation.service";
import {ValidationResult, ValidationResultMapController} from "../../domain/meta.rule";
import {MetaEntity} from "../../domain/meta.entity";
import {MetaEntityService} from "../../meta/meta-entity/meta-entity.service";
import {DataFormatService} from "@perfect-stack/nestjs-server/data/import/data-format.service";


export interface CheckForDuplicates {
    checkForDuplicates(entity: Entity): Promise<boolean>;
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
            dataImportModel.importedRowCount = 0;
        }

        const dataImportMapping = await this.findDataImportMapping(dataImportModel.dataFormat);
        const nextRow = dataImportModel.dataRows[stepIndex];

        if (this.isBlankRow(dataImportModel.headers, nextRow, dataImportMapping)) {
            dataImportModel.skipRows.push(true);
        }
        else {
            dataImportModel.skipRows.push(false);
            dataImportModel.importedRowCount = dataImportModel.importedRowCount + 1;

            // create entity
            const createEntityResponse = await this.createEntity(dataImportMapping, dataImportModel.headers, nextRow, stepIndex);
            dataImportModel.errors.push(...createEntityResponse.dataImportErrors)

            // validate entity
            const validationResultMapController = await this.validate(dataImportMapping.metaEntityName, createEntityResponse.entity);
            this.addErrors(validationResultMapController, stepIndex, dataImportModel, dataImportMapping, nextRow, createEntityResponse.entity);
        }
    }



    async dataImportImport(stepIndex: number, dataImportModel: DataImportModel) {

        if(stepIndex === 0) {
            dataImportModel.importedEntityList = [];
            dataImportModel.processedRowCount = 0;
        }

        const dataImportMapping = await this.findDataImportMapping(dataImportModel.dataFormat);
        const nextRow = dataImportModel.dataRows[stepIndex];

        if (this.isBlankRow(dataImportModel.headers, nextRow, dataImportMapping)) {
            dataImportModel.skipRows.push(true);
            dataImportModel.importedEntityList.push(null);
        }
        else {
            dataImportModel.skipRows.push(false);
            dataImportModel.processedRowCount = dataImportModel.processedRowCount + 1;

            // create entity
            const createEntityResponse = await this.createEntity(dataImportMapping, dataImportModel.headers, nextRow, stepIndex);
            dataImportModel.errors.push(...createEntityResponse.dataImportErrors)

            // validate entity
            const validationResultMapController = await this.validate(dataImportMapping.metaEntityName, createEntityResponse.entity);
            this.addErrors(validationResultMapController, stepIndex, dataImportModel, dataImportMapping, nextRow, createEntityResponse.entity);

            if(!validationResultMapController.hasErrors()) {
                const entityResponse = await this.dataService.save(dataImportMapping.metaEntityName, createEntityResponse.entity);
                if(entityResponse) {
                    const entityResultMapController = new ValidationResultMapController(entityResponse.validationResults);
                    if(!entityResultMapController.hasErrors()) {
                        dataImportModel.importedEntityList.push(entityResponse.entity.id);
                        dataImportModel.rowSuccessCount = dataImportModel.rowSuccessCount + 1;
                        await dataImportMapping.postImportActions.postImport(entityResponse.entity);
                    }
                    else {
                        throw new Error('Attempted save, but it failed');
                    }
                }
            }
        }
    }

    findColName(colName: string, headers: string[]): number | null {
        // find the colName (if possible) or return null if not found
        const colIdx = headers.indexOf(colName);
        return colIdx >= 0 ? colIdx : null;
    }

    findColIdxFromValidationResult(validationResult: ValidationResult, dataImportMapping: DataImportMapping, headers: string[]) {
        const attributeName = validationResult.name;
        const attributeMapping = dataImportMapping.attributeMappings.find(nextAttributeMapping => nextAttributeMapping.attributeName === attributeName);
        if(attributeMapping) {
            return this.findColName(attributeMapping.columnName, headers);
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
        const colIdx = this.findColIdxFromValidationResult(validationResult, dataImportMapping, headers);
        const colNum = colIdx ? colIdx : 0;
        return {
            row: rowIdx,
            col: colNum,
            message: validationResult.message
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
                const colIdx = headers.indexOf(nextAttributeMapping.columnName);
                if(colIdx >= 0) {
                    const colValue = dataRow[colIdx];
                    if(colValue !== null && colValue !== '' && typeof colValue !== 'undefined') {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    async createEntity(dataImportMapping: DataImportMapping, headers: string[], dataRow: string[], rowIdx: number): Promise<CreateEntityResponse> {

        // create an entity for this data row
        const entity: Entity = {
            id: null
        };

        const dataImportErrors: DataImportError[] = [];

        // for each data mapping
        for(const nextAttributeMapping of dataImportMapping.attributeMappings) {
            let converterResult: ConverterResult;
            if(nextAttributeMapping.columnName) {
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
                        col: converterResult.col,
                        message: nextAttributeValue.error
                    });
                }
            }
        }

        // check for duplicates (but only if no errors)
        if(dataImportErrors.length === 0) {
            if (await dataImportMapping.duplicateCheck.checkForDuplicates(entity)) {
                dataImportErrors.push({
                    row: rowIdx,
                    col: 0,
                    message: 'A duplicate entity for this data already exists - unable to import'
                });
            }
        }

        return {entity, dataImportErrors};
    }

    async convertExternalValue(attributeMapping: DataAttributeMapping, headers: string[], dataRow: string[]) {
        // find the externalValue by "columnName"
        const colIdx = headers.indexOf(attributeMapping.columnName);
        if(colIdx < 0) {
            throw new Error(`Unable to find column name ${attributeMapping.columnName} in file`);
        }

        const externalValue = dataRow[colIdx];
        const converterResult = await attributeMapping.converter.toAttributeValue(attributeMapping.attributeName, externalValue);
        if(!converterResult) {
            // This error should never happen but probably will during development if Converter is not implemented
            throw new Error(`Unable to convert external value ${externalValue} for attribute ${attributeMapping.attributeName}`);
        }
        converterResult.col = colIdx;
        return converterResult;
    }


    convertDefaultValue(attributeMapping: DataAttributeMapping): ConverterResult {
        return {
            col: 0,
            attributeValues: [{
                name: attributeMapping.attributeName,
                value: attributeMapping.defaultValue
            }]
        }
    }


    async findDataImportMapping(dataFormat: string): Promise<DataImportMapping> {
        return this.dataFormatService.getDataFormat(dataFormat);
    }
}