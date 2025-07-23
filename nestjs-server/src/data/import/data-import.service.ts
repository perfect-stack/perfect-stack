import {Injectable} from "@nestjs/common";
import * as csv from 'fast-csv';
import * as fs from "fs";
import {DataImportModel} from "./data-import.model";

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

        // TODO: convert the data into the DataImportModel and validate it for errors

        const dataImportModel = new DataImportModel();
        if(data && data.length > 0) {
            dataImportModel.headers = data[0];
            dataImportModel.dataRows = data.slice(1);
        }

        return dataImportModel;
    }
}