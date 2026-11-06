import {BadRequestException, ConflictException, Injectable, Logger} from "@nestjs/common";
import {Job, JobExecutionContext, JobHandler, StepJobHandler, TaskJobHandler} from "./job.model";
import {DataService} from "../data/data.service";
import {OrmService} from "../orm/orm.service";
import {QueryService} from "../data/query.service";
import {Duration, OffsetDateTime} from "@js-joda/core";
import {ConfigService} from "@nestjs/config";
import {EventEmitter2, OnEvent} from "@nestjs/event-emitter";
import {EventBridgeClient, PutEventsCommand, PutEventsCommandInput} from "@aws-sdk/client-eventbridge";
import {QueryTypes, Transaction} from "sequelize";
import * as uuid from 'uuid';

const JOB_TIMEOUT_IN_SECONDS = 60 * 60;
const JOB_CHUNK_DURATION_IN_SECONDS = 5 + 60;

@Injectable()
export class JobService {
    private readonly logger = new Logger(JobService.name);
    private readonly jobHandlers = new Map<string, JobHandler>();

    jobProcessingMode: string;

    constructor(
        protected readonly configService: ConfigService,
        protected readonly ormService: OrmService,
        protected readonly dataService: DataService,
        protected readonly queryService: QueryService,
        protected readonly eventEmitter: EventEmitter2
    ) {
        this.jobProcessingMode = configService.get('JOB_PROCESSING_MODE', 'async');
    }

    private get isPostgres(): boolean {
        return typeof this.ormService?.sequelize?.getDialect === 'function' && this.ormService.sequelize.getDialect() === 'postgres';
    }

    registerJob(name: string, handler: JobHandler) {
        if (this.jobHandlers.has(name)) {
            throw new Error(`Job '${name}' is already registered`);
        }
        this.jobHandlers.set(name, handler);
        this.logger.log(`Registered job handler for: ${name}`);
    }

    getJobList(includeHidden: boolean = false): string[] {
        const list: string[] = [];
        for (const [name, handler] of this.jobHandlers.entries()) {
            const isVisible = handler.showInBatchUI ? handler.showInBatchUI() : true;
            if (includeHidden || isVisible) {
                list.push(name);
            }
        }
        return list.sort();
    }

    getBatchJobList(): string[] {
        return this.getJobList(false);
    }

    async getJobSummary(jobName: string): Promise<any> {
        this.logger.log(`Get summary of job: ${jobName}`);
        const handler = this.jobHandlers.get(jobName);
        if (!handler) {
            throw new Error(`Unable to find job handler for '${jobName}'`);
        }
        if (handler.getSummary) {
            return await handler.getSummary();
        }
        return null;
    }

    async getJobById(jobId: string): Promise<Job | null> {
        const rows: Job[] = await this.ormService.sequelize.query(
            `SELECT id, name, status, status_message, data, step_index, step_count, chunk_size, duration, result_summary,
                    filename, executed_by, data_format, row_count, imported_count, error_count, valid_count, skipped_count,
                    created_at, updated_at
             FROM "Job"
             WHERE id = :id;`,
            {
                replacements: { id: jobId },
                type: QueryTypes.SELECT,
            }
        );
        return rows && rows.length > 0 ? rows[0] : null;
    }

    async getLatestJob(jobName: string): Promise<Job | null> {
        const rows: Job[] = await this.ormService.sequelize.query(
            `SELECT id, name, status, status_message, data, step_index, step_count, chunk_size, duration, result_summary,
                    filename, executed_by, data_format, row_count, imported_count, error_count, valid_count, skipped_count,
                    created_at, updated_at
             FROM "Job"
             WHERE name = :name
             ORDER BY created_at DESC
             LIMIT 1;`,
            {
                replacements: { name: jobName },
                type: QueryTypes.SELECT,
            }
        );
        return rows && rows.length > 0 ? rows[0] : null;
    }

    async startJob(name: string, payload: any = null, stepCount: number = 1, chunkSize: number = 1): Promise<Job> {
        const handler = this.jobHandlers.get(name);
        if (!handler) {
            throw new BadRequestException(`Unable to find job handler for '${name}'`);
        }
        let effectiveStepCount = stepCount;
        if (effectiveStepCount <= 1 && handler.getSummary) {
            try {
                const summary = await handler.getSummary();
                if (summary) {
                    if (typeof summary.totalCount === 'number') effectiveStepCount = summary.totalCount;
                    else if (typeof summary.rowCount === 'number') effectiveStepCount = summary.rowCount;
                    else if (typeof summary.remainingCount === 'number') effectiveStepCount = summary.remainingCount;
                }
            } catch (e) {
                // fallback to stepCount
            }
        }
        const effectiveChunkSize = chunkSize > 1 ? chunkSize : ((handler as StepJobHandler)?.chunkSize || chunkSize || 1);
        const job = await this.submitJob(name, effectiveStepCount, payload, effectiveChunkSize);
        await this.invokeJob(job.id);
        return job;
    }

    async stopJob(jobIdOrName: string): Promise<Job> {
        this.logger.log(`Stopping job: ${jobIdOrName}`);

        if (this.isPostgres) {
            // Atomic DB transition: transitions any active matching job (by ID or by name) to Stopped
            const stoppedRows: Job[] = await this.ormService.sequelize.query(
                `UPDATE "Job"
                 SET status = 'Stopped',
                     status_message = 'Job stopped by user',
                     updated_at = NOW()
                 WHERE (id = :idOrName OR (name = :idOrName AND status IN ('Submitted', 'Processing')))
                   AND status IN ('Submitted', 'Processing')
                 RETURNING id, name, status, status_message, data, step_index, step_count, chunk_size, duration, result_summary, created_at, updated_at;`,
                {
                    replacements: { idOrName: jobIdOrName },
                    type: QueryTypes.SELECT,
                }
            );

            if (stoppedRows && stoppedRows.length > 0) {
                const stoppedJob = stoppedRows[0];
                this.logger.log(`Job ${stoppedJob.id} (${stoppedJob.name}) atomically transitioned to Stopped in database.`);
                return stoppedJob;
            }
        } else {
            await this.ormService.sequelize.query(
                `UPDATE "Job"
                 SET status = 'Stopped',
                     status_message = 'Job stopped by user',
                     updated_at = CURRENT_TIMESTAMP
                 WHERE (id = :idOrName OR (name = :idOrName AND status IN ('Submitted', 'Processing')))
                   AND status IN ('Submitted', 'Processing');`,
                {
                    replacements: { idOrName: jobIdOrName },
                }
            );

            const stoppedJob = await this.getJobById(jobIdOrName) || await this.getLatestJob(jobIdOrName);
            if (stoppedJob && stoppedJob.status === 'Stopped') {
                this.logger.log(`Job ${stoppedJob.id} (${stoppedJob.name}) atomically transitioned to Stopped in database.`);
                return stoppedJob;
            }
        }

        // If no active job was stopped, check if the job exists (could already be Stopped, Completed, or Error)
        const existingJob = await this.getJobById(jobIdOrName) || await this.getLatestJob(jobIdOrName);
        if (!existingJob) {
            throw new BadRequestException(`Job not found: ${jobIdOrName}`);
        }

        this.logger.log(`Job ${existingJob.id} (${existingJob.name}) is already in status '${existingJob.status}'.`);
        return existingJob;
    }

    async submitJob(name: string, stepCount: number, payload: any, chunkSize: number = 1, metadata?: Partial<Job>): Promise<Job> {
        // Use a database transaction to ensure that across multiple NestJS server instances,
        // only one instance of a Batch Job can be submitted/running at a given time.
        return await this.ormService.sequelize.transaction(async (txn: Transaction) => {
            if (this.isPostgres) {
                // Acquire a transaction-level advisory lock specifically for this job name
                // The lock is automatically released when this transaction commits or rolls back
                await this.ormService.sequelize.query(
                    `SELECT pg_advisory_xact_lock(hashtext(:lockKey));`,
                    {
                        replacements: { lockKey: `batch_job_${name}` },
                        transaction: txn,
                    }
                );
            }

            // Check if there is already a running job with this name
            const activeJobs: Job[] = await this.ormService.sequelize.query(
                `SELECT id, name, status, status_message, step_index, step_count, chunk_size, duration, data, result_summary, created_at, updated_at
                 FROM "Job"
                 WHERE name = :name AND status IN ('Submitted', 'Processing')
                 ORDER BY created_at DESC${this.isPostgres ? ' FOR UPDATE' : ''};`,
                {
                    replacements: { name },
                    type: QueryTypes.SELECT,
                    transaction: txn,
                }
            );

            if (activeJobs && activeJobs.length > 0) {
                const activeJob = activeJobs[0];

                // Check if the job has exceeded maximum timeout (e.g. from a crashed previous instance)
                const startTime = activeJob.created_at ? new Date(activeJob.created_at).getTime() : 0;
                const elapsedSeconds = startTime ? (Date.now() - startTime) / 1000 : 0;

                if (elapsedSeconds > JOB_TIMEOUT_IN_SECONDS) {
                    this.logger.warn(`Found stale job ${activeJob.id} for '${name}' running for ${elapsedSeconds}s (exceeded timeout). Marking as Error.`);
                    await this.ormService.sequelize.query(
                        `UPDATE "Job"
                         SET status = 'Error', status_message = 'Job timed out or server process terminated'
                         WHERE id = :id;`,
                        {
                            replacements: { id: activeJob.id },
                            transaction: txn,
                        }
                    );
                } else {
                    this.logger.warn(`Attempted to start job '${name}' but job ${activeJob.id} is already in status '${activeJob.status}'.`);
                    throw new ConflictException(`Job '${name}' is already running (Job ID: ${activeJob.id}, status: ${activeJob.status}). Only one instance can run at a time.`);
                }
            }

            // No active job running, proceed to create new job
            const newJob: Job = {
                id: uuid.v4(),
                name: name,
                status: "Submitted",
                status_message: null,
                duration: 0,
                data: payload ? (typeof payload === 'string' ? payload : JSON.stringify(payload)) : null,
                step_index: 0,
                step_count: stepCount,
                chunk_size: chunkSize,
                result_summary: metadata?.result_summary ?? null,
                filename: metadata?.filename ?? null,
                executed_by: metadata?.executed_by ?? null,
                data_format: metadata?.data_format ?? null,
                row_count: metadata?.row_count ?? stepCount,
                imported_count: metadata?.imported_count ?? 0,
                error_count: metadata?.error_count ?? 0,
                valid_count: metadata?.valid_count ?? 0,
                skipped_count: metadata?.skipped_count ?? 0,
                created_at: new Date(),
                updated_at: new Date(),
            };

            if (this.isPostgres) {
                const insertRows: Job[] = await this.ormService.sequelize.query(
                    `INSERT INTO "Job" (id, name, status, status_message, step_index, step_count, chunk_size, duration, data, result_summary, filename, executed_by, data_format, row_count, imported_count, error_count, valid_count, skipped_count, created_at, updated_at)
                     VALUES (:id, :name, :status, :status_message, :step_index, :step_count, :chunk_size, :duration, :data, :result_summary, :filename, :executed_by, :data_format, :row_count, :imported_count, :error_count, :valid_count, :skipped_count, :created_at, :updated_at)
                     RETURNING id, name, status, status_message, step_index, step_count, chunk_size, duration, data, result_summary, filename, executed_by, data_format, row_count, imported_count, error_count, valid_count, skipped_count, created_at, updated_at;`,
                    {
                        replacements: newJob as any,
                        type: QueryTypes.SELECT,
                        transaction: txn,
                    }
                );

                const createdJob = insertRows && insertRows.length > 0 ? insertRows[0] : newJob;
                this.logger.log(`Created new job ${createdJob.id} for '${name}' (status: ${createdJob.status}, stepCount: ${stepCount}, chunkSize: ${chunkSize})`);
                return createdJob;
            } else {
                await this.ormService.sequelize.query(
                    `INSERT INTO "Job" (id, name, status, status_message, step_index, step_count, chunk_size, duration, data, result_summary, filename, executed_by, data_format, row_count, imported_count, error_count, valid_count, skipped_count, created_at, updated_at)
                     VALUES (:id, :name, :status, :status_message, :step_index, :step_count, :chunk_size, :duration, :data, :result_summary, :filename, :executed_by, :data_format, :row_count, :imported_count, :error_count, :valid_count, :skipped_count, :created_at, :updated_at);`,
                    {
                        replacements: newJob as any,
                        transaction: txn,
                    }
                );
                this.logger.log(`Created new job ${newJob.id} for '${name}' (status: ${newJob.status}, stepCount: ${stepCount}, chunkSize: ${chunkSize})`);
                return newJob;
            }
        });
    }

    async updateJobCounts(jobId: string, counts: {
        row_count?: number;
        imported_count?: number;
        error_count?: number;
        valid_count?: number;
        skipped_count?: number;
        result_summary?: string | null;
    }): Promise<void> {
        const updateClauses: string[] = [];
        const replacements: any = { id: jobId };
        if (counts.row_count !== undefined) {
            updateClauses.push('row_count = :row_count');
            replacements.row_count = counts.row_count;
        }
        if (counts.imported_count !== undefined) {
            updateClauses.push('imported_count = :imported_count');
            replacements.imported_count = counts.imported_count;
        }
        if (counts.error_count !== undefined) {
            updateClauses.push('error_count = :error_count');
            replacements.error_count = counts.error_count;
        }
        if (counts.valid_count !== undefined) {
            updateClauses.push('valid_count = :valid_count');
            replacements.valid_count = counts.valid_count;
        }
        if (counts.skipped_count !== undefined) {
            updateClauses.push('skipped_count = :skipped_count');
            replacements.skipped_count = counts.skipped_count;
        }
        if (counts.result_summary !== undefined) {
            updateClauses.push('result_summary = :result_summary');
            replacements.result_summary = counts.result_summary;
        }
        if (updateClauses.length > 0) {
            await this.ormService.sequelize.query(
                `UPDATE "Job" SET ${updateClauses.join(', ')} WHERE id = :id;`,
                { replacements }
            );
        }
    }

    async searchJobs(criteria: {
        pageNumber?: number;
        pageSize?: number;
        statusList?: string[];
        jobNames?: string[];
        textSearch?: string;
        filename?: string;
        executedBy?: string;
        dataFormat?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<{ totalCount: number; pageNumber: number; pageSize: number; resultList: Job[] }> {
        const pageNumber = Math.max(1, criteria.pageNumber || 1);
        const pageSize = Math.max(1, Math.min(100, criteria.pageSize || 25));
        const offset = (pageNumber - 1) * pageSize;

        const whereParts: string[] = ['1=1'];
        const replacements: any = {
            limit: pageSize,
            offset: offset,
        };

        if (criteria.jobNames && criteria.jobNames.length > 0) {
            whereParts.push(`name IN (:jobNames)`);
            replacements.jobNames = criteria.jobNames;
        }

        if (criteria.statusList && criteria.statusList.length > 0) {
            whereParts.push(`status IN (:statusList)`);
            replacements.statusList = criteria.statusList;
        }

        if (criteria.filename && criteria.filename.trim()) {
            replacements.filename = `%${criteria.filename.trim()}%`;
            whereParts.push(this.isPostgres ? `filename ILIKE :filename` : `filename LIKE :filename`);
        }

        if (criteria.executedBy && criteria.executedBy.trim()) {
            replacements.executedBy = `%${criteria.executedBy.trim()}%`;
            whereParts.push(this.isPostgres ? `executed_by ILIKE :executedBy` : `executed_by LIKE :executedBy`);
        }

        if (criteria.dataFormat && criteria.dataFormat.trim()) {
            replacements.dataFormat = `%${criteria.dataFormat.trim()}%`;
            whereParts.push(this.isPostgres ? `data_format ILIKE :dataFormat` : `data_format LIKE :dataFormat`);
        }

        if (criteria.textSearch && criteria.textSearch.trim()) {
            const searchTerm = `%${criteria.textSearch.trim()}%`;
            replacements.searchTerm = searchTerm;
            if (this.isPostgres) {
                whereParts.push(`(filename ILIKE :searchTerm OR executed_by ILIKE :searchTerm OR name ILIKE :searchTerm OR data_format ILIKE :searchTerm)`);
            } else {
                whereParts.push(`(filename LIKE :searchTerm OR executed_by LIKE :searchTerm OR name LIKE :searchTerm OR data_format LIKE :searchTerm)`);
            }
        }

        if (criteria.startDate) {
            whereParts.push(`created_at >= :startDate`);
            replacements.startDate = new Date(criteria.startDate);
        }

        if (criteria.endDate) {
            whereParts.push(`created_at <= :endDate`);
            replacements.endDate = new Date(criteria.endDate);
        }

        const whereSql = whereParts.join(' AND ');

        const countRows: any[] = await this.ormService.sequelize.query(
            `SELECT COUNT(*) as count FROM "Job" WHERE ${whereSql};`,
            {
                replacements,
                type: QueryTypes.SELECT,
            }
        );
        const totalCount = countRows && countRows.length > 0 ? parseInt(countRows[0].count || countRows[0]['COUNT(*)'] || '0', 10) : 0;

        // We intentionally omit `data` to avoid serializing massive JSON blobs in search results
        const selectSql = `
            SELECT id, name, status, status_message, step_index, step_count, chunk_size, duration, result_summary,
                   filename, executed_by, data_format, row_count, imported_count, error_count, valid_count, skipped_count,
                   created_at, updated_at
            FROM "Job"
            WHERE ${whereSql}
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset;
        `;

        const resultList: Job[] = await this.ormService.sequelize.query(selectSql, {
            replacements,
            type: QueryTypes.SELECT,
        });

        return {
            totalCount,
            pageNumber,
            pageSize,
            resultList,
        };
    }

    async invokeJob(jobId: string) {
        if (this.jobProcessingMode === 'local-sync') {
            await this.executeJob(jobId);
        } else if (this.jobProcessingMode === 'local-async') {
            this.eventEmitter.emit('job.invoke.local-async', jobId);
        } else if (this.jobProcessingMode === 'async') {
            // Default to local-async unless AWS EventBridge target is configured
            if (this.configService.get('EVENT_BRIDGE_ENDPOINT')) {
                await this.sendEventToEventBridge({ jobId: jobId });
            } else {
                this.eventEmitter.emit('job.invoke.local-async', jobId);
            }
        } else {
            throw new Error(`Unknown jobProcessingMode of ${this.jobProcessingMode}`);
        }
    }

    private async sendEventToEventBridge(detail: any): Promise<void> {
        this.logger.log('Send event to EventBridge');

        const params: PutEventsCommandInput = {
            Entries: [{
                Detail: JSON.stringify(detail),
                DetailType: 'InvokeJobEvent',
                Source: 'kims.jobs'
            }],
        };

        try {
            const command = new PutEventsCommand(params);
            const client = new EventBridgeClient();
            await client.send(command);
            this.logger.log(`Successfully sent event with jobId: ${detail.jobId}`);
        } catch (error) {
            this.logger.error('Failed to send event to EventBridge:', error);
            throw error;
        }
    }

    @OnEvent('job.invoke.local-async', { async: true })
    async handleLocalJobProcessing(jobId: string) {
        this.logger.log(`Simulating local async job for job ID: ${jobId}.`);
        try {
            await this.executeJob(jobId);
            this.logger.log(`Local async job simulation finished for job ID: ${jobId}`);
        } catch (error) {
            this.logger.error(`Error during local async job simulation for job ID: ${jobId}`, error.stack);
        }
    }

    private async markJobProcessingAtomic(jobId: string): Promise<Job | null> {
        if (this.isPostgres) {
            const rows: Job[] = await this.ormService.sequelize.query(
                `UPDATE "Job"
                 SET status = 'Processing',
                     status_message = NULL,
                     updated_at = NOW()
                 WHERE id = :id AND status IN ('Submitted', 'Processing')
                 RETURNING id, name, status, status_message, data, step_index, step_count, chunk_size, duration, result_summary, created_at, updated_at;`,
                {
                    replacements: { id: jobId },
                    type: QueryTypes.SELECT,
                }
            );
            return rows && rows.length > 0 ? rows[0] : null;
        } else {
            await this.ormService.sequelize.query(
                `UPDATE "Job"
                 SET status = 'Processing',
                     status_message = NULL,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = :id AND status IN ('Submitted', 'Processing');`,
                {
                    replacements: { id: jobId },
                }
            );
            return await this.getJobById(jobId);
        }
    }

    private async updateJobProgressAtomic(jobId: string, updates: {
        stepIndex?: number;
        stepCount?: number;
        statusMessage?: string | null;
        duration?: number;
        data?: string | null;
        resultSummary?: string | null;
    }): Promise<Job | null> {
        if (this.isPostgres) {
            const rows: Job[] = await this.ormService.sequelize.query(
                `UPDATE "Job"
                 SET step_index = COALESCE(:stepIndex, step_index),
                     step_count = COALESCE(:stepCount, step_count),
                     status_message = COALESCE(:statusMessage, status_message),
                     duration = COALESCE(:duration, duration),
                     data = COALESCE(:data, data),
                     result_summary = COALESCE(:resultSummary, result_summary),
                     updated_at = NOW()
                 WHERE id = :id AND status = 'Processing'
                 RETURNING id, name, status, status_message, data, step_index, step_count, chunk_size, duration, result_summary, created_at, updated_at;`,
                {
                    replacements: {
                        id: jobId,
                        stepIndex: updates.stepIndex !== undefined ? updates.stepIndex : null,
                        stepCount: updates.stepCount !== undefined ? updates.stepCount : null,
                        statusMessage: updates.statusMessage !== undefined ? updates.statusMessage : null,
                        duration: updates.duration !== undefined ? updates.duration : null,
                        data: updates.data !== undefined ? updates.data : null,
                        resultSummary: updates.resultSummary !== undefined ? updates.resultSummary : null,
                    },
                    type: QueryTypes.SELECT,
                }
            );
            return rows && rows.length > 0 ? rows[0] : null;
        } else {
            const current = await this.getJobById(jobId);
            if (!current || current.status !== 'Processing') {
                return null;
            }
            await this.ormService.sequelize.query(
                `UPDATE "Job"
                 SET step_index = COALESCE(:stepIndex, step_index),
                     step_count = COALESCE(:stepCount, step_count),
                     status_message = COALESCE(:statusMessage, status_message),
                     duration = COALESCE(:duration, duration),
                     data = COALESCE(:data, data),
                     result_summary = COALESCE(:resultSummary, result_summary),
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = :id AND status = 'Processing';`,
                {
                    replacements: {
                        id: jobId,
                        stepIndex: updates.stepIndex !== undefined ? updates.stepIndex : null,
                        stepCount: updates.stepCount !== undefined ? updates.stepCount : null,
                        statusMessage: updates.statusMessage !== undefined ? updates.statusMessage : null,
                        duration: updates.duration !== undefined ? updates.duration : null,
                        data: updates.data !== undefined ? updates.data : null,
                        resultSummary: updates.resultSummary !== undefined ? updates.resultSummary : null,
                    },
                }
            );
            return await this.getJobById(jobId);
        }
    }

    private async markJobCompletedAtomic(jobId: string, updates: {
        duration?: number;
        resultSummary?: string | null;
        data?: string | null;
        stepIndex?: number;
    }): Promise<Job | null> {
        if (this.isPostgres) {
            const rows: Job[] = await this.ormService.sequelize.query(
                `UPDATE "Job"
                 SET status = 'Completed',
                     step_index = COALESCE(:stepIndex, step_count, step_index),
                     duration = COALESCE(:duration, duration),
                     data = COALESCE(:data, data),
                     result_summary = COALESCE(:resultSummary, result_summary),
                     updated_at = NOW()
                 WHERE id = :id AND status = 'Processing'
                 RETURNING id, name, status, status_message, data, step_index, step_count, chunk_size, duration, result_summary, created_at, updated_at;`,
                {
                    replacements: {
                        id: jobId,
                        stepIndex: updates.stepIndex !== undefined ? updates.stepIndex : null,
                        duration: updates.duration !== undefined ? updates.duration : null,
                        data: updates.data !== undefined ? updates.data : null,
                        resultSummary: updates.resultSummary !== undefined ? updates.resultSummary : null,
                    },
                    type: QueryTypes.SELECT,
                }
            );
            return rows && rows.length > 0 ? rows[0] : null;
        } else {
            const current = await this.getJobById(jobId);
            if (!current || current.status !== 'Processing') {
                return null;
            }
            await this.ormService.sequelize.query(
                `UPDATE "Job"
                 SET status = 'Completed',
                     step_index = COALESCE(:stepIndex, step_count, step_index),
                     duration = COALESCE(:duration, duration),
                     data = COALESCE(:data, data),
                     result_summary = COALESCE(:resultSummary, result_summary),
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = :id AND status = 'Processing';`,
                {
                    replacements: {
                        id: jobId,
                        stepIndex: updates.stepIndex !== undefined ? updates.stepIndex : null,
                        duration: updates.duration !== undefined ? updates.duration : null,
                        data: updates.data !== undefined ? updates.data : null,
                        resultSummary: updates.resultSummary !== undefined ? updates.resultSummary : null,
                    },
                }
            );
            return await this.getJobById(jobId);
        }
    }

    private async markJobErrorAtomic(jobId: string, errorMessage: string, duration?: number, data?: string | null): Promise<Job | null> {
        if (this.isPostgres) {
            const rows: Job[] = await this.ormService.sequelize.query(
                `UPDATE "Job"
                 SET status = 'Error',
                     status_message = :errorMessage,
                     duration = COALESCE(:duration, duration),
                     data = COALESCE(:data, data),
                     updated_at = NOW()
                 WHERE id = :id AND status IN ('Submitted', 'Processing')
                 RETURNING id, name, status, status_message, data, step_index, step_count, chunk_size, duration, result_summary, created_at, updated_at;`,
                {
                    replacements: {
                        id: jobId,
                        errorMessage,
                        duration: duration !== undefined ? duration : null,
                        data: data !== undefined ? data : null,
                    },
                    type: QueryTypes.SELECT,
                }
            );
            return rows && rows.length > 0 ? rows[0] : null;
        } else {
            await this.ormService.sequelize.query(
                `UPDATE "Job"
                 SET status = 'Error',
                     status_message = :errorMessage,
                     duration = COALESCE(:duration, duration),
                     data = COALESCE(:data, data),
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = :id AND status IN ('Submitted', 'Processing');`,
                {
                    replacements: {
                        id: jobId,
                        errorMessage,
                        duration: duration !== undefined ? duration : null,
                        data: data !== undefined ? data : null,
                    },
                }
            );
            return await this.getJobById(jobId);
        }
    }

    async executeJob(jobId: string): Promise<Job> {
        this.logger.log(`Execute job: ${jobId}`);
        const job = await this.getJobById(jobId);
        if (!job) {
            throw new Error(`Job not found: ${jobId}`);
        }

        // If the job was already stopped, completed, or failed, do not resume or overwrite state
        if (job.status === 'Stopped') {
            this.logger.log(`Job ${jobId} (${job.name}) is already Stopped. Skipping execution.`);
            return job;
        }
        if (job.status === 'Completed' || job.status === 'Error') {
            this.logger.log(`Job ${jobId} (${job.name}) is already ${job.status}. Skipping execution.`);
            return job;
        }

        const handler = this.jobHandlers.get(job.name);
        if (!handler) {
            throw new Error(`No handler registered for job: ${job.name}`);
        }

        if (handler.type === 'step') {
            return await this.executeStepJob(job, handler as StepJobHandler);
        } else {
            return await this.executeTaskJob(job, handler as TaskJobHandler);
        }
    }

    private async executeStepJob(initialJob: Job, handler: StepJobHandler): Promise<Job> {
        const startTime = OffsetDateTime.now();
        const jobId = initialJob.id;

        // Atomically transition from Submitted to Processing
        const processingJob = await this.markJobProcessingAtomic(jobId);
        if (!processingJob) {
            const currentJob = await this.getJobById(jobId);
            this.logger.log(`Job ${jobId} (${initialJob.name}) cannot transition to Processing (status: ${currentJob?.status}). Halting.`);
            return currentJob || initialJob;
        }

        let job = processingJob;
        const chunkSize = job.chunk_size || handler.chunkSize || 1;
        const stepIndex = job.step_index || 0;
        const stepCount = job.step_count;

        try {
            for (let nextStepIdx = stepIndex; nextStepIdx < stepCount; nextStepIdx += chunkSize) {
                // Pre-step atomic DB status check
                const preStepJob = await this.getJobById(jobId);
                if (preStepJob && preStepJob.status === 'Stopped') {
                    this.logger.log(`Job ${jobId} (${job.name}) was stopped before step ${nextStepIdx}. Halting execution.`);
                    return preStepJob;
                }

                this.logger.log(`Execute job ${jobId} (${job.name}): step ${nextStepIdx} of ${stepCount} (chunk size: ${chunkSize})`);
                await handler.executeStep(job, nextStepIdx, chunkSize);

                const calculatedDuration = Duration.between(startTime, OffsetDateTime.now()).toMillis();
                const nextStepIndex = Math.min(stepCount, nextStepIdx + chunkSize);

                // Atomic DB progress update: only updates if status is still 'Processing'
                const updatedJob = await this.updateJobProgressAtomic(jobId, {
                    stepIndex: nextStepIndex,
                    duration: calculatedDuration,
                    data: job.data,
                });

                if (!updatedJob) {
                    const stoppedDbJob = await this.getJobById(jobId);
                    this.logger.log(`Job ${jobId} (${job.name}) progress update aborted because status is '${stoppedDbJob?.status}'. Halting.`);
                    return stoppedDbJob || job;
                }

                job = updatedJob;

                const jobStartTime = OffsetDateTime.parse(job.created_at ? new Date(job.created_at).toISOString() : new Date().toISOString());
                const jobDurationInSeconds = Duration.between(jobStartTime, OffsetDateTime.now()).seconds();
                if (jobDurationInSeconds > JOB_TIMEOUT_IN_SECONDS) {
                    this.logger.error('JOB TIMEOUT EXCEEDED');
                    throw new Error('JOB TIMEOUT EXCEEDED');
                }

                const chunkDurationInSeconds = Duration.between(startTime, OffsetDateTime.now()).seconds();
                if (chunkDurationInSeconds > JOB_CHUNK_DURATION_IN_SECONDS && nextStepIndex < stepCount) {
                    const chunkCheckDbJob = await this.getJobById(jobId);
                    if (chunkCheckDbJob && chunkCheckDbJob.status !== 'Processing') {
                        this.logger.log(`Job ${jobId} (${job.name}) is '${chunkCheckDbJob.status}'. Skipping subsequent chunk invocation.`);
                        return chunkCheckDbJob;
                    }
                    this.logger.log('Chunk complete: invoking job again');
                    await this.invokeJob(job.id);
                    return null;
                }
            }

            let summaryStr: string | null = null;
            if (handler.onComplete) {
                const summary = await handler.onComplete(job);
                if (summary !== undefined) {
                    summaryStr = typeof summary === 'string' ? summary : JSON.stringify(summary);
                }
            }

            const endTime = OffsetDateTime.now();
            const finalDuration = Duration.between(startTime, endTime).toMillis();

            // Atomic DB completion: only transitions to 'Completed' if status is still 'Processing'
            const completedJob = await this.markJobCompletedAtomic(jobId, {
                duration: finalDuration,
                data: job.data,
                resultSummary: summaryStr || job.result_summary,
                stepIndex: stepCount,
            });

            if (!completedJob) {
                const finalDbJob = await this.getJobById(jobId);
                this.logger.log(`Job ${jobId} (${job.name}) completion skipped because status is '${finalDbJob?.status}'.`);
                return finalDbJob || job;
            }

            this.logger.log(`Execute job ${jobId} (${job.name}) completed in ${completedJob.duration}ms`);
            return completedJob;
        } catch (error) {
            const errorDbJob = await this.getJobById(jobId);
            if (errorDbJob && errorDbJob.status === 'Stopped') {
                this.logger.log(`Job ${jobId} (${job.name}) was stopped during step execution. Preserving Stopped status.`);
                return errorDbJob;
            }

            const endTime = OffsetDateTime.now();
            const finalDuration = Duration.between(startTime, endTime).toMillis();
            await this.markJobErrorAtomic(jobId, error.message ?? String(error), finalDuration, job.data);
            throw error;
        }
    }

    private async executeTaskJob(initialJob: Job, handler: TaskJobHandler): Promise<Job> {
        const startTime = OffsetDateTime.now();
        const jobId = initialJob.id;

        // Atomically transition from Submitted to Processing
        const processingJob = await this.markJobProcessingAtomic(jobId);
        if (!processingJob) {
            const currentJob = await this.getJobById(jobId);
            this.logger.log(`Task Job ${jobId} (${initialJob.name}) cannot transition to Processing (status: ${currentJob?.status}). Halting.`);
            return currentJob || initialJob;
        }

        let job = processingJob;
        let lastSaveTime = Date.now();
        let isStopped = false;

        const ctx: JobExecutionContext = {
            get job() {
                return job;
            },
            updateProgress: async (stepIndex: number, stepCount?: number, statusMessage?: string) => {
                const calculatedDuration = Duration.between(startTime, OffsetDateTime.now()).toMillis();
                const now = Date.now();
                const isLastStep = (stepCount !== undefined && stepIndex >= stepCount) ||
                                   (job.step_count && stepIndex >= job.step_count);

                if (now - lastSaveTime > 1000 || isLastStep) {
                    // Atomic update: only updates DB if status is still 'Processing'
                    const updated = await this.updateJobProgressAtomic(jobId, {
                        stepIndex,
                        stepCount,
                        statusMessage,
                        duration: calculatedDuration,
                        data: job.data,
                        resultSummary: job.result_summary,
                    });

                    if (!updated) {
                        isStopped = true;
                        const stoppedDbJob = await this.getJobById(jobId);
                        if (stoppedDbJob) {
                            job = stoppedDbJob;
                        }
                        throw new Error('JOB_STOPPED');
                    }
                    job = updated;
                    lastSaveTime = now;
                } else {
                    // In-memory update between saves
                    job.step_index = stepIndex;
                    if (stepCount !== undefined) job.step_count = stepCount;
                    if (statusMessage !== undefined) job.status_message = statusMessage;
                    job.duration = calculatedDuration;
                }
            },
            setSummary: (summary: any) => {
                const dataObj = job.data ? JSON.parse(job.data) : {};
                dataObj.summary = summary;
                job.data = JSON.stringify(dataObj);
                job.result_summary = typeof summary === 'string' ? summary : JSON.stringify(summary);
            }
        };

        try {
            const summary = await handler.execute(ctx);
            if (summary !== undefined) {
                ctx.setSummary(summary);
            }

            const endTime = OffsetDateTime.now();
            const finalDuration = Duration.between(startTime, endTime).toMillis();

            // Atomic DB completion: only transitions if status is still 'Processing'
            const completedJob = await this.markJobCompletedAtomic(jobId, {
                duration: finalDuration,
                data: job.data,
                resultSummary: job.result_summary,
                stepIndex: job.step_count,
            });

            if (!completedJob) {
                const finalDbJob = await this.getJobById(jobId);
                this.logger.log(`Task Job ${jobId} (${job.name}) was not in Processing status (${finalDbJob?.status}). Preserving status.`);
                return finalDbJob || job;
            }

            this.logger.log(`Execute task job ${jobId} (${job.name}) completed in ${completedJob.duration}ms`);
            return completedJob;
        } catch (error) {
            if (isStopped || error.message === 'JOB_STOPPED') {
                const stoppedDbJob = await this.getJobById(jobId);
                this.logger.log(`Execute task job ${jobId} (${job.name}) stopped.`);
                return stoppedDbJob || job;
            }

            const errorDbJob = await this.getJobById(jobId);
            if (errorDbJob && errorDbJob.status === 'Stopped') {
                this.logger.log(`Execute task job ${jobId} (${job.name}) was stopped on error. Preserving Stopped status.`);
                return errorDbJob;
            }

            const endTime = OffsetDateTime.now();
            const finalDuration = Duration.between(startTime, endTime).toMillis();
            await this.markJobErrorAtomic(jobId, error.message ?? String(error), finalDuration, job.data);
            throw error;
        }
    }

    async pollJobStatus(jobId: string): Promise<Job> {
        const job = await this.getJobById(jobId);
        if (!job) {
            throw new BadRequestException(`Job not found: ${jobId}`);
        }
        return job;
    }
}
