import {DataImportModel} from "./data-import.model";
import {Injectable} from "@nestjs/common";

import * as fs from 'fs';
import * as csv from "fast-csv";
import {DataFormatService} from "@perfect-stack/nestjs-server/data/import/data-format.service";


@Injectable()
export class DataImportFileService {

    constructor(protected readonly dataFormatService: DataFormatService) {}

    async parseFile(dataFormat: string, filePath: string): Promise<DataImportModel> {

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

            if(!this.dataFormatService.isValidDataFormat(dataFormat)) {
                throw new Error(`Unknown data format of: ${dataFormat}`);
            }

            const dataImportModel = new DataImportModel();
            if (data && data.length > 0) {
                dataImportModel.dataFormat = dataFormat;
                dataImportModel.headers = data[0];
                dataImportModel.dataRows = data.slice(1);
            }

            return dataImportModel;
        }
        catch (error) {
            return {
                status: 'error',
                dataFormat: dataFormat,
                headers: ["Error parsing file"],
                skipRows: [],
                dataRows: [[error.message]],
                importedRowCount: 0,
                processedRowCount: 0,
                rowSuccessCount: 0,
                importedEntityList: [],
                errors: [{
                    col: 0,
                    row: 0,
                    message: error.message
                }]
            }
        }
    }
}