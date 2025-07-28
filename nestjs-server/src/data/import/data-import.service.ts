import {Injectable} from "@nestjs/common";
import * as csv from 'fast-csv';
import * as fs from "fs";
import {DataImportError, DataImportModel, DataImportResult} from "./data-import.model";
import {CreateEntityResponse, DataAttributeMapping, DataImportMapping} from "./data-import.types";
import {DateConverter} from "./converter/date.converter";
import {IntegerConverter} from "./converter/integer.converter";
import {Entity} from "../../domain/entity";
import {ConverterResult} from "./converter/converter.types";
import {BandNumberLookupConverter} from "./converter/band-number.converter";
import {QueryService} from "../query.service";
import {ValidationService} from "../validation.service";
import {ValidationResult, ValidationResultMapController} from "../../domain/meta.rule";
import {MetaEntity} from "../../domain/meta.entity";
import {MetaEntityService} from "../../meta/meta-entity/meta-entity.service";



@Injectable()
export class DataImportService {


    constructor(protected readonly queryService: QueryService,
                protected readonly metaEntityService: MetaEntityService,
                protected readonly validationService: ValidationService) {
    }

    async parseFile(filePath: string): Promise<DataImportModel> {

        // Use fast-csv and parse the file into a 2d array of raw values
        // The 'async' keyword means this function will always return a Promise.
        // We wrap the stream-based parser in a new Promise so we can 'await' its completion.
        const data: string[][] = await new Promise((resolve, reject) => {
            const data: string[][] = [];

            // read the file from the filePath and create a stream for it
            const stream = fs.createReadStream(filePath);

            stream
                .pipe(csv.parse({headers: false})) // 'headers: false' ensures the header row is treated like any other data row.
                .on('error', (error) => reject(error))
                .on('data', (row: string[]) => data.push(row))
                .on('end', (rowCount: number) => {
                    console.log(`Successfully parsed ${rowCount} rows.`);
                    resolve(data);
                });
        });

        const dataImportModel = new DataImportModel();
        if(data && data.length > 0) {
            dataImportModel.headers = data[0];
            dataImportModel.dataRows = data.slice(1);
        }

        // TODO: convert the data into the DataImportModel and validate it for errors
        const validatedDataImportModel = await this.processAndValidate(dataImportModel);
        return validatedDataImportModel;
    }

    async processAndValidate(dataImportModel: DataImportModel): Promise<DataImportModel> {

        // find the data mapping for this file (may only be one)
        const dataImportMapping = await this.findDataImportMapping();

        // for each data row
        for(let rowIdx = 0; rowIdx < dataImportModel.dataRows.length; rowIdx++) {
            const nextRow = dataImportModel.dataRows[rowIdx];

            if (!this.isBlankRow(nextRow)) {
                // create entity
                const createEntityResponse = await this.createEntity(dataImportMapping, dataImportModel.headers, nextRow, rowIdx);
                dataImportModel.errors.push(...createEntityResponse.dataImportErrors)

                // validate entity
                const validationResultMapController = await this.validate(dataImportMapping.metaEntityName, createEntityResponse.entity);
                if(validationResultMapController.hasErrors()) {

                    // Add the validation errors to the dataImportModel
                    const validationErrors = validationResultMapController.validationResultMap;
                    for(const nextErrorKey of Object.keys(validationErrors)) {
                        const nextError = validationErrors[nextErrorKey];
                        dataImportModel.errors.push(this.toDataImportError(nextError, rowIdx, dataImportModel.headers, dataImportMapping));
                    }


                    console.log('IMPORT ERRORS: ');
                    console.log(' Data:   ' + JSON.stringify(nextRow))
                    console.log(' Entity: ' + JSON.stringify(createEntityResponse.entity));
                    for(const nextErrorKey of Object.keys(validationResultMapController.validationResultMap)) {
                        const validationError = validationResultMapController.validationResultMap[nextErrorKey];
                        console.log(` - Error: ${nextErrorKey}: ${validationError.message}`);
                    }
                }
                else {
                    console.log('IMPORT GOOD: ');
                    console.log(' Data:   ' + JSON.stringify(nextRow))
                    console.log(' Entity: ' + JSON.stringify(createEntityResponse.entity));
                }

                // if !valid then
                //   - convert errors for return
            }
        }

        return dataImportModel;
    }

    async processAndSave(dataImportModel: DataImportModel): Promise<DataImportResult> {

        console.log('Ready to processAndSave... ' + dataImportModel.dataRows.length + ' rows');

        const dataImportResult = new DataImportResult();
        dataImportResult.rowSuccessCount = 42;

        // for each data row
        // create entity
        // "save" entity (will do validation)
        // if save fails
        //   - convert error for return
        return dataImportResult;
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

    isBlankRow(dataRow: string[]) {
        // return true if all fields in the dataRow are null, empty, or undefined
        return dataRow.every(field => field === null || field === '' || typeof field === 'undefined');
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


    async findDataImportMapping(): Promise<DataImportMapping> {
        return {
            metaEntityName: 'Event',
            attributeMappings: [
                {
                    attributeName: 'event_type',
                    defaultValue: 'Transmitter'
                },
                {
                    attributeName: 'data_source',
                    defaultValue: 'KIMS'
                },
                {
                    attributeName: 'activities',
                    defaultValue: []
                },
                {
                    attributeName: 'observers',
                    defaultValue: []
                },
                {
                    attributeName: 'instruments',
                    defaultValue: []
                },
                {
                    columnName: 'Event Date',
                    attributeName: 'date_time',
                    converter: new DateConverter()
                },
                {
                    columnName: 'Easting NZTM',
                    attributeName: 'easting',
                    converter: new IntegerConverter()
                },
                {
                    columnName: 'Northing NZTM',
                    attributeName: 'northing',
                    converter: new IntegerConverter()
                },
                {
                    columnName: 'V band',
                    converter: new BandNumberLookupConverter(this.queryService),
                },
            ]
        }
    }
}