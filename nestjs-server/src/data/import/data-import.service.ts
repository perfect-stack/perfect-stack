import {Injectable} from "@nestjs/common";
import * as csv from 'fast-csv';
import * as fs from "fs";
import {DataImportError, DataImportModel} from "./data-import.model";
import {CreateEntityResponse, DataAttributeMapping, DataImportMapping} from "./data-import.types";
import {DateConverter} from "./converter/date.converter";
import {IntegerConverter} from "./converter/integer.converter";
import {Entity} from "../../domain/entity";
import {ConverterResult} from "./converter/converter.types";





@Injectable()
export class DataImportService {


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

        // for each data row
        for(let rowIdx = 0; rowIdx < dataImportModel.dataRows.length; rowIdx++) {
            const nextRow = dataImportModel.dataRows[rowIdx];

            // create entity
            const createEntityResponse = await this.createEntity(dataImportModel.headers, nextRow, rowIdx);
            dataImportModel.errors.push(...createEntityResponse.dataImportErrors)

            // validate entity
            // if !valid then
            //   - convert errors for return
        }

        return dataImportModel;
    }

    async processAndSave(dataImportModel: DataImportModel): Promise<DataImportModel> {
        // for each data row
        // create entity
        // "save" entity (will do validation)
        // if save fails
        //   - convert error for return
        return;
    }

    async createEntity(headers: string[], dataRow: string[], rowIdx: number): Promise<CreateEntityResponse> {

        // find the data mapping for this file (may only be one)
        const dataImportMapping = await this.findDataImportMapping();

        // create an entity for this data row
        const entity: Entity = {
            id: null
        };

        const dataImportErrors: DataImportError[] = [];

        // for each data mapping
        for(const nextAttributeMapping of dataImportMapping.attributeMappings) {
            let converterResult: ConverterResult;
            if(nextAttributeMapping.columnName) {
                converterResult = this.convertExternalValue(nextAttributeMapping, headers, dataRow);
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

    convertExternalValue(attributeMapping: DataAttributeMapping, headers: string[], dataRow: string[]) {
        // find the externalValue by "columnName"
        const colIdx = headers.indexOf(attributeMapping.columnName);
        if(colIdx < 0) {
            throw new Error(`Unable to find column name ${attributeMapping.columnName} in file`);
        }

        const externalValue = dataRow[colIdx];
        const converterResult = attributeMapping.converter.toAttributeValue(attributeMapping.attributeName, externalValue);
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
                    defaultValue: `Transmitter`
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
                }
            ]
        }
    }
}