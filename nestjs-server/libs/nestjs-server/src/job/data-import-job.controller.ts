import {
    BadRequestException,
    Body,
    ConflictException,
    Controller,
    Get,
    Logger,
    MaxFileSizeValidator,
    NotFoundException,
    Param,
    ParseFilePipe,
    Post,
    Query,
    Req,
    UploadedFile,
    UseInterceptors
} from "@nestjs/common";
import { Request } from "express";
import {diskStorage} from "multer";
import {ActionPermit} from "../authentication/action-permit";
import {ActionType} from "../domain/meta.role";
import {SubjectName} from "../authentication/subject";
import {FileInterceptor} from "@nestjs/platform-express";
import {ApiBody, ApiConsumes, ApiResponse, ApiTags} from "@nestjs/swagger";
import {DataImportModel} from "../data/import/data-import.model";
import {Job} from "./job.model";
import {JobService} from "./job.service";

import * as path from 'path';
import * as fs from 'fs';
import * as os from "node:os";
import {v4 as uuidv4} from "uuid";
import {DataImportService} from "../data/import/data-import.service";
import {ConfigService} from "@nestjs/config";
import {OrmService} from "../orm/orm.service";
import {DataService} from "../data/data.service";


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

    constructor(
        protected configService: ConfigService,
        protected readonly jobService: JobService,
        protected readonly dataImportService: DataImportService,
        protected readonly ormService: OrmService,
        protected readonly dataService: DataService,
    ) {
        this.jobProcessingMode = configService.get('JOB_PROCESSING_MODE', 'sync');
    }

    private extractUserName(req: any): string {
        if (!req || !req.user) {
            return 'System / Local';
        }
        const user = req.user;
        if (user.given_name || user.family_name) {
            return `${user.given_name || ''} ${user.family_name || ''}`.trim();
        }
        if (user.name) return user.name;
        if (user.username) return user.username;
        if (user.email) return user.email;
        return 'Unknown User';
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
                dataFormat: {
                    type: 'string'
                },
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
            required: ['dataFormat', 'file']
        },
    })
    @ApiResponse({
        status: 201,
        description: 'File uploaded and validated',
        type: Object,
    })
    async uploadFile(
        @UploadedFile( new ParseFilePipe({
            validators: [
                new MaxFileSizeValidator({maxSize: 10 * 1024 * 1024})
            ],
            fileIsRequired: true
        })) file: Express.Multer.File,
        @Body('dataFormat') dataFormat: string,
        @Req() req: Request
    ): Promise<Job> {

        // The interceptor takes care of creating the file on the server and then just gives us
        // the "File" handle to that file.
        if(file) {
            console.log('File uploaded successfully:', file);
            console.log('Saved to path:', file.path); // Path where multer saved the file
            console.log('Original filename:', file.originalname);
            console.log('Mimetype:', file.mimetype);
            console.log('Size:', file.size);

            const executedBy = this.extractUserName(req);
            const filename = file.originalname;

            const dataImportModel = await this.dataImportService.parseFile(dataFormat, file.path);
            dataImportModel.status = 'loaded';
            dataImportModel.filename = filename;
            dataImportModel.executedBy = executedBy;

            const job = await this.jobService.submitJob(
                'Data Import - Validate',
                dataImportModel.dataRows.length,
                dataImportModel,
                1,
                {
                    filename,
                    executed_by: executedBy,
                    data_format: dataFormat,
                    row_count: dataImportModel.dataRows.length,
                    imported_count: 0,
                    error_count: 0,
                    valid_count: 0,
                    skipped_count: 0,
                }
            );
            await this.jobService.invokeJob(job.id);
            return job;
        }
        else {
            throw new Error("Unable to upload file");
        }
    }


    @ActionPermit(ActionType.Edit)
    @SubjectName('Import')
    @ApiResponse({
        status: 201,
        description: 'Data import submitted',
        type: Object,
    })
    @Post('/import')
    async importData(
        @Body() dataImportModel: DataImportModel,
        @Req() req: Request
    ): Promise<Job> {
        const hasErrors = !!(dataImportModel.importResult && dataImportModel.importResult.some(r => r.errors && r.errors.length > 0));
        if(!hasErrors) {
            const executedBy = this.extractUserName(req);
            const filename = dataImportModel.filename || 'Unknown';
            dataImportModel.executedBy = executedBy;

            const validCount = dataImportModel.importResult ? dataImportModel.importResult.filter(r => r && !r.skipFlag && (!r.errors || r.errors.length === 0)).length : 0;
            const errorCount = dataImportModel.importResult ? dataImportModel.importResult.filter(r => r && !r.skipFlag && r.errors && r.errors.length > 0).length : 0;
            const skippedCount = dataImportModel.importResult ? dataImportModel.importResult.filter(r => r && (r.skipFlag || r.skipReason === 'Blank' || r.skipReason === 'Duplicate')).length : 0;

            const job = await this.jobService.submitJob(
                'Data Import - Import',
                dataImportModel.dataRows.length,
                dataImportModel,
                1,
                {
                    filename,
                    executed_by: executedBy,
                    data_format: dataImportModel.dataFormat,
                    row_count: dataImportModel.dataRows.length,
                    imported_count: 0,
                    error_count: errorCount,
                    valid_count: validCount,
                    skipped_count: skippedCount,
                }
            );
            await this.jobService.invokeJob(job.id);
            return job;
        }
        else {
            throw new Error('Data Import must not have any errors');
        }
    }

    @ActionPermit(ActionType.Read)
    @SubjectName('Job')
    @Get('/search')
    async searchDataImportJobs(
        @Query('pageNumber') pageNumber?: string,
        @Query('pageSize') pageSize?: string,
        @Query('status') status?: string | string[],
        @Query('textSearch') textSearch?: string,
        @Query('jobNames') jobNames?: string | string[],
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ): Promise<any> {
        let statusList: string[] = [];
        if (status) {
            statusList = Array.isArray(status) ? status : status.split(',').map(s => s.trim()).filter(Boolean);
        }

        let names: string[] = ['Data Import - Import', 'Data Import - Validate'];
        if (jobNames) {
            names = Array.isArray(jobNames) ? jobNames : jobNames.split(',').map(n => n.trim()).filter(Boolean);
        }

        return this.jobService.searchJobs({
            pageNumber: pageNumber ? parseInt(pageNumber, 10) : 1,
            pageSize: pageSize ? parseInt(pageSize, 10) : 25,
            statusList: statusList.length > 0 ? statusList : undefined,
            jobNames: names,
            textSearch,
            startDate,
            endDate,
        });
    }

    @ActionPermit(ActionType.Edit)
    @SubjectName('Import')
    @Post('/rollback/:jobId')
    async rollbackJob(@Param('jobId') jobId: string): Promise<any> {
        const job = await this.jobService.getJobById(jobId);
        if (!job) {
            throw new NotFoundException(`Job with ID ${jobId} not found`);
        }

        if (job.status === 'RolledBack') {
            throw new BadRequestException(`Job ${jobId} has already been rolled back`);
        }

        if (!job.data) {
            throw new BadRequestException(`Job ${jobId} contains no data payload`);
        }

        let dataImportModel: DataImportModel;
        try {
            dataImportModel = JSON.parse(job.data);
        } catch (e) {
            throw new BadRequestException(`Failed to parse job data payload`);
        }

        const importedIds = (dataImportModel.importedEntityList || []).filter((id): id is string => !!id);
        if (importedIds.length === 0) {
            return {
                success: true,
                message: 'No imported entities were found to delete for this job',
                deletedCount: 0,
            };
        }

        const dataImportMapping = await this.dataImportService.findDataImportMapping(dataImportModel.dataFormat);
        if (!dataImportMapping) {
            throw new BadRequestException(`Data format mapping '${dataImportModel.dataFormat}' not found`);
        }
        const metaEntityName = dataImportMapping.metaEntityName;

        // Safe conflict check: ensure none of the entities have new relationships preventing deletion
        const blockedIds: string[] = [];
        for (const entityId of importedIds) {
            try {
                const canDestroy = await this.dataService.destroyCheck(metaEntityName, entityId);
                if (!canDestroy) {
                    blockedIds.push(entityId);
                }
            } catch (err: any) {
                blockedIds.push(entityId);
            }
        }

        if (blockedIds.length > 0) {
            throw new ConflictException({
                statusCode: 409,
                message: `Unable to roll back import: ${blockedIds.length} of ${importedIds.length} entities cannot be deleted because dependent records or relationships exist.`,
                blockedIds,
            });
        }

        // All checks passed, destroy entities
        let deletedCount = 0;
        for (const entityId of importedIds) {
            try {
                await this.dataService.destroy(metaEntityName, entityId);
                deletedCount++;
            } catch (err: any) {
                this.logger.error(`Error deleting entity ${entityId} during rollback:`, err);
                throw new Error(`Failed to delete entity ${entityId}: ${err.message}`);
            }
        }

        // Update DataImportModel to reflect deletion
        dataImportModel.status = 'error';
        dataImportModel.importedEntityList = [];
        if (dataImportModel.importResult) {
            for (const rowResult of dataImportModel.importResult) {
                if (rowResult.actualEntity) {
                    rowResult.actualEntity = null;
                }
            }
        }

        const isPostgres = this.ormService.sequelize.getDialect() === 'postgres';
        await this.ormService.sequelize.query(
            `UPDATE "Job"
             SET status = 'RolledBack',
                 status_message = 'Imported entities were rolled back by user',
                 imported_count = 0,
                 data = :data,
                 result_summary = :resultSummary,
                 updated_at = ${isPostgres ? 'NOW()' : 'CURRENT_TIMESTAMP'}
             WHERE id = :id;`,
            {
                replacements: {
                    id: jobId,
                    data: JSON.stringify(dataImportModel),
                    resultSummary: `Rolled back: ${deletedCount} entities deleted`,
                },
            }
        );

        return {
            success: true,
            deletedCount,
            message: `Successfully deleted ${deletedCount} imported entities`,
            jobId,
            status: 'RolledBack',
        };
    }
}