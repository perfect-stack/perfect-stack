import {
    Body,
    Controller,
    MaxFileSizeValidator,
    ParseFilePipe,
    Post,
    UploadedFile,
    UseInterceptors
} from "@nestjs/common";
import {JobController} from "./job.controller";
import {diskStorage} from "multer";
import path from "path";
import os from "node:os";
import fs from "fs";
import {v4 as uuidv4} from "uuid";
import {ActionPermit} from "../authentication/action-permit";
import {ActionType} from "../domain/meta.role";
import {SubjectName} from "../authentication/subject";
import {FileInterceptor} from "@nestjs/platform-express";
import {ApiBody, ApiConsumes, ApiTags} from "@nestjs/swagger";
import {DataImportModel, DataImportResult} from "../data/import/data-import.model";
import * as csv from "fast-csv";
import {JobModel} from "./job.model";
import {JobService} from "./job.service";

const storageOptions = diskStorage({
    // Use a function for destination to ensure the directory exists.
    destination: (req, file, callback) => {
        const uploadPath = path.join(os.tmpdir(), 'data-import', 'upload');
        fs.mkdirSync(uploadPath, { recursive: true });
        callback(null, uploadPath);
    },

    filename: (req, file, callback) => {
        // Generate a unique filename to prevent overwrites and conflicts.
        const uniqueSuffix = uuidv4();
        const extension = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, extension);

        // Sanitize the base name to remove problematic characters.
        const safeBaseName = baseName.replace(/[^a-z0-9_.-]/gi, '_').toLowerCase();

        callback(null, `${safeBaseName}-${uniqueSuffix}${extension}`);
    },
});


/**
 * The role of a "SomethingJobController" is to translate the "specific" request of that type of Job into a generic
 * request for all Jobs to follow.
 */
@ApiTags('job/data-import')
@Controller('job/data-import')
export class DataImportJobController {


    constructor(protected readonly jobService: JobService) {}


    @ActionPermit(ActionType.Edit)
    @SubjectName('Import')
    @Post('/upload')
    @UseInterceptors(FileInterceptor('file', {storage: storageOptions}))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    async uploadFile(@UploadedFile( new ParseFilePipe({validators: [
            new MaxFileSizeValidator({maxSize: 10 * 1024 * 1024})
        ], fileIsRequired: true
    })) file: Express.Multer.File): Promise<JobModel> {

        // The interceptor takes care of creating the file on the server and then just gives us
        // the "File" handle to that file.
        if(file) {
            console.log('File uploaded successfully:', file);
            console.log('Saved to path:', file.path); // Path where multer saved the file
            console.log('Original filename:', file.originalname);
            console.log('Mimetype:', file.mimetype);
            console.log('Size:', file.size);

            const dataImportModel = await this.parseFile(file.path);
            dataImportModel.action = "Validate";

            return await this.jobService.submitJob(dataImportModel);
        }
        else {
            throw new Error("Unable to upload file")
        }
    }


    private async parseFile(filePath: string): Promise<DataImportModel> {

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

            return dataImportModel;
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


    @ActionPermit(ActionType.Edit)
    @SubjectName('Import')
    @Post('/data')
    async importData(@Body() dataImportModel: DataImportModel): Promise<JobModel> {
        if(dataImportModel.errors.length === 0) {
            dataImportModel.action = "Import";
            return await this.jobService.submitJob(dataImportModel);
        }
        else {
            throw new Error('Data Import must not have any errors');
        }
    }
}