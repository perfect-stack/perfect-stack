import {
    Body,
    Controller, Logger,
    MaxFileSizeValidator,
    ParseFilePipe,
    Post,
    UploadedFile,
    UseInterceptors
} from "@nestjs/common";
import {diskStorage} from "multer";
import {ActionPermit} from "../authentication/action-permit";
import {ActionType} from "../domain/meta.role";
import {SubjectName} from "../authentication/subject";
import {FileInterceptor} from "@nestjs/platform-express";
import {ApiBody, ApiConsumes, ApiTags} from "@nestjs/swagger";
import {DataImportModel} from "../data/import/data-import.model";
import {Job} from "./job.model";
import {JobService} from "./job.service";

import * as path from 'path';
import * as fs from 'fs';
import * as os from "node:os";
import {v4 as uuidv4} from "uuid";
import {DataImportFileService} from "../data/import/data-import-file.service";
import {ConfigService} from "@nestjs/config";
import {EventEmitter2, OnEvent} from "@nestjs/event-emitter";

import {InvokeCommand, LambdaClient} from "@aws-sdk/client-lambda";

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

    private readonly logger = new Logger(DataImportJobController.name);


    jobProcessingMode: string;

    constructor(protected configService: ConfigService,
                protected readonly jobService: JobService,
                protected readonly dataImportFileService: DataImportFileService,
                protected readonly eventEmitter: EventEmitter2
    ) {
        this.jobProcessingMode = configService.get('JOB_PROCESSING_MODE', 'sync');
    }


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
    })) file: Express.Multer.File): Promise<Job> {

        // The interceptor takes care of creating the file on the server and then just gives us
        // the "File" handle to that file.
        if(file) {
            console.log('File uploaded successfully:', file);
            console.log('Saved to path:', file.path); // Path where multer saved the file
            console.log('Original filename:', file.originalname);
            console.log('Mimetype:', file.mimetype);
            console.log('Size:', file.size);

            const dataImportModel = await this.dataImportFileService.parseFile(file.path);
            dataImportModel.status = 'loaded';

            const job = await this.jobService.submitJob('Data Import - Validate', dataImportModel.dataRows.length, dataImportModel);
            return this.invokeJob(job);
        }
        else {
            throw new Error("Unable to upload file")
        }
    }


    @ActionPermit(ActionType.Edit)
    @SubjectName('Import')
    @Post('/import')
    async importData(@Body() dataImportModel: DataImportModel): Promise<Job> {
        if(dataImportModel.errors.length === 0) {
            const job = await this.jobService.submitJob('Data Import - Import', dataImportModel.dataRows.length, dataImportModel);
            return this.invokeJob(job);
        }
        else {
            throw new Error('Data Import must not have any errors');
        }
    }

    private async invokeJob(job: Job) {
        switch (this.jobProcessingMode) {
            case 'sync':
                // Wait for the Job result from invoking the Job and return that
                return await this.jobService.invokeJob(job.id);

            case 'local-async':
                this.eventEmitter.emit('job.invoke.local-async', job);
                return job;

            case 'async':
                // Invoke the lambda
                await this.invokeJobLambda(job);

                // But don't wait for the response and return the Job we created above
                return job;

            default:
                throw new Error(`Invalid job processing mode: ${this.jobProcessingMode}`);
        }
    }

    private async invokeJobLambda(job: Job) {

        this.logger.log(`Invoking Lambda: for job ID: ${job.id}`);

        const payload = {
            jobId: job.id
        };

        const lambdaClient = new LambdaClient();

        const command = new InvokeCommand({

            // TODO: hard coded for now...
            FunctionName: 'dev-kims-docker-function',

            InvocationType: 'Event', // For asynchronous invocation
            Payload: JSON.stringify(payload),
        });

        await lambdaClient.send(command);

        this.logger.log('Invoking Lambda: invocation completed');
    }


    @OnEvent('job.invoke.local-async', { async: true })
    async handleLocalJobProcessing(job: Job) {
        this.logger.log(`Simulating local async job for job ID: ${job.id}.`);

        try {
            await this.jobService.invokeJob(job.id);
            this.logger.log(`Local async job simulation finished for job ID: ${job.id}`);
        } catch (error) {
            this.logger.error(`Error during local async job simulation for job ID: ${job.id}`, error.stack);
        }
    }
}