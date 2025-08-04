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
import {DataService} from "../data.service";
import {ValidationService} from "../validation.service";
import {ValidationResult, ValidationResultMapController} from "../../domain/meta.rule";
import {MetaEntity} from "../../domain/meta.entity";
import {MetaEntityService} from "../../meta/meta-entity/meta-entity.service";
import {DuplicateEventCheck} from "./duplicate-event-check";
import {PostImportEventActions} from "./post-import-event-actions";
import {TextConverter} from "./converter/text.converter";
import {TrackingFlightStatusConverter} from "./converter/tracking-flight-status.converter";


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
                protected readonly duplicateEventCheck: DuplicateEventCheck,
                protected readonly postImportEventActions: PostImportEventActions,
                protected readonly metaEntityService: MetaEntityService,
                protected readonly validationService: ValidationService) {
    }

    async parseFile(filePath: string): Promise<DataImportModel> {

        try {
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
            if (data && data.length > 0) {
                dataImportModel.headers = data[0];
                dataImportModel.dataRows = data.slice(1);
            }

            return await this.processAndValidate(dataImportModel, null);
        }
        catch (error) {
            return {
                action: undefined,
                headers: ["Error parsing file"],
                skipRows: [],
                dataRows: [[error.message]],
                importedRowCount: 0,
                errors: [{
                    col: 0,
                    row: 0,
                    message: error.message
                }]
            }
        }
    }

    async processAndValidate(dataImportModel: DataImportModel, dataImportResult: DataImportResult): Promise<DataImportModel> {

        // find the data mapping for this file (may only be one)
        const dataImportMapping = await this.findDataImportMapping();
        dataImportModel.skipRows = [];
        if(dataImportResult) {
            dataImportResult.importedEntityList = [];
        }

        // for each data row
        let importRowCount = 0;
        for(let rowIdx = 0; rowIdx < dataImportModel.dataRows.length; rowIdx++) {
            const nextRow = dataImportModel.dataRows[rowIdx];

            if (this.isBlankRow(dataImportModel.headers, nextRow, dataImportMapping)) {
                dataImportModel.skipRows.push(true);
                if(dataImportResult) {
                    dataImportResult.importedEntityList.push(null);
                }
            }
            else {
                importRowCount = importRowCount + 1;
                dataImportModel.skipRows.push(false);

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

                    if(dataImportResult) {
                        const entityResponse = await this.dataService.save(dataImportMapping.metaEntityName, createEntityResponse.entity);
                        if(entityResponse) {
                            const entityResultMapController = new ValidationResultMapController(entityResponse.validationResults);
                            if(!entityResultMapController.hasErrors()) {
                                dataImportResult.importedEntityList.push(entityResponse.entity.id);
                                dataImportResult.rowSuccessCount = dataImportResult.rowSuccessCount + 1;
                                await dataImportMapping.postImportActions.postImport(entityResponse.entity);
                            }
                            else {
                                throw new Error('Attempted save, but it failed');
                            }
                        }
                    }
                }
            }
        }

        dataImportModel.importedRowCount = importRowCount;
        return dataImportModel;
    }

    async processAndSave(dataImportModel: DataImportModel): Promise<DataImportResult> {

        console.log('Ready to processAndSave... ' + dataImportModel.dataRows.length + ' rows');
        const dataImportResult = new DataImportResult();
        await this.processAndValidate(dataImportModel, dataImportResult);

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

        //return dataRow.every(field => field === null || field === '' || typeof field === 'undefined');
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


    async findDataImportMapping(): Promise<DataImportMapping> {
        return {
            metaEntityName: 'Event',
            duplicateCheck: this.duplicateEventCheck,
            postImportActions: this.postImportEventActions,
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
                    columnName: 'V band',
                    indicatesBlankRow: false,
                    converter: new BandNumberLookupConverter(this.queryService),
                },
                {
                    // Important: this converter must be processed after the BandNumberLookupConverter
                    columnName: 'Status',
                    attributeName: 'status',
                    indicatesBlankRow: true,
                    converter: new TrackingFlightStatusConverter(),
                },
                {
                    columnName: 'Date',
                    attributeName: 'date_time',
                    indicatesBlankRow: true,
                    converter: new DateConverter()
                },
                {
                    columnName: 'Date',
                    attributeName: 'end_date_time',
                    indicatesBlankRow: true,
                    converter: new DateConverter()
                },
                {
                    columnName: 'Easting NZTM',
                    attributeName: 'easting',
                    indicatesBlankRow: true,
                    converter: new IntegerConverter()
                },
                {
                    columnName: 'Northing NZTM',
                    attributeName: 'northing',
                    indicatesBlankRow: true,
                    converter: new IntegerConverter()
                },
                {
                    columnName: 'Comments',
                    attributeName: 'comments',
                    indicatesBlankRow: true,
                    converter: new TextConverter()
                },
            ]
        }
    }
}