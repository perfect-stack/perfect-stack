import {BadRequestException, ConflictException, Injectable, Logger} from "@nestjs/common";
import {Job, JobExecutionContext, JobHandler, StepJobHandler, TaskJobHandler} from "./job.model";
import {DataService} from "../data/data.service";
import {OrmService} from "../orm/orm.service";
import {QueryService} from "../data/query.service";
import {QueryRequest} from "../data/query.request";
import {AttributeType, ComparisonOperator} from "../domain/meta.entity";
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

    async getLatestJob(jobName: string): Promise<Job | null> {
        const queryRequest = new QueryRequest();
        queryRequest.metaEntityName = 'Job';
        queryRequest.criteria = [
            {
                name: 'name',
                value: jobName,
                attributeType: AttributeType.Text,
                operator: ComparisonOperator.Equals,
            },
        ];
        queryRequest.orderByName = 'created_at';
        queryRequest.orderByDir = 'DESC';
        queryRequest.pageSize = 1;
        const response = await this.queryService.findByCriteria(queryRequest);
        if (response && response.resultList && response.resultList.length > 0) {
            return response.resultList[0] as Job;
        }
        return null;
    }

    async startJob(name: string, payload: any = null, stepCount: number = 1, chunkSize: number = 1): Promise<Job> {
        const handler = this.jobHandlers.get(name);
        if (!handler) {
            throw new BadRequestException(`Unable to find job handler for '${name}'`);
        }
        const effectiveChunkSize = chunkSize > 1 ? chunkSize : ((handler as StepJobHandler)?.chunkSize || chunkSize || 1);
        const job = await this.submitJob(name, stepCount, payload, effectiveChunkSize);
        await this.invokeJob(job.id);
        return job;
    }

    async stopJob(jobIdOrName: string): Promise<Job> {
        this.logger.log(`Stopping job: ${jobIdOrName}`);
        let job = await this.queryService.findOne('Job', jobIdOrName) as Job;
        if (!job) {
            job = await this.getLatestJob(jobIdOrName);
        }
        if (!job) {
            throw new BadRequestException(`Job not found: ${jobIdOrName}`);
        }
        if (job.status === 'Completed' || job.status === 'Error' || job.status === 'Stopped') {
            return job;
        }
        job.status = 'Stopped';
        job.status_message = 'Job stopped by user';
        await this.dataService.save('Job', job);
        this.logger.log(`Job ${job.id} (${job.name}) marked as Stopped in database.`);
        return job;
    }

    async submitJob(name: string, stepCount: number, payload: any, chunkSize: number = 1): Promise<Job> {
        // Use a database transaction and PostgreSQL advisory lock to ensure that across
        // multiple NestJS server instances, only one instance of a Batch Job can be submitted/running at a given time.
        return await this.ormService.sequelize.transaction(async (txn: Transaction) => {
            // Acquire a transaction-level advisory lock specifically for this job name
            // The lock is automatically released when this transaction commits or rolls back
            await this.ormService.sequelize.query(
                `SELECT pg_advisory_xact_lock(hashtext(:lockKey));`,
                {
                    replacements: { lockKey: `batch_job_${name}` },
                    transaction: txn,
                }
            );

            // Check if there is already a running job with this name
            const activeJobs: Job[] = await this.ormService.sequelize.query(
                `SELECT id, name, status, status_message, step_index, step_count, chunk_size, duration, data, result_summary, created_at, updated_at
                 FROM "Job"
                 WHERE name = :name AND status IN ('Submitted', 'Processing')
                 ORDER BY created_at DESC
                 FOR UPDATE;`,
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
                result_summary: null,
                created_at: new Date(),
                updated_at: new Date(),
            };

            const JobModel = this.ormService.sequelize.model('Job');
            const createdModel = await JobModel.create(newJob as any, { transaction: txn });
            return (typeof (createdModel as any).toJSON === 'function' ? (createdModel as any).toJSON() : createdModel) as Job;
        });
    }

    async invokeJob(jobId: string) {
        switch (this.jobProcessingMode) {
            case 'sync':
                return await this.executeJob(jobId);
            case 'local-async':
                this.eventEmitter.emit('job.invoke.local-async', jobId);
                break;
            case 'async':
                await this.invokeJobLambda(jobId);
                break;
            default:
                throw new Error(`Invalid job processing mode: ${this.jobProcessingMode}`);
        }
    }

    private async invokeJobLambda(jobId: string) {
        this.logger.log(`Invoking EventBridge for job ID: ${jobId}`);
        const detail = { jobId };
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

    async executeJob(jobId: string): Promise<Job> {
        this.logger.log(`Execute job: ${jobId}`);
        const job = await this.queryService.findOne('Job', jobId) as Job;
        if (!job) {
            throw new Error(`Job not found: ${jobId}`);
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

    private async executeStepJob(job: Job, handler: StepJobHandler): Promise<Job> {
        const startTime = OffsetDateTime.now();
        job.status = "Processing";
        job.status_message = null;
        await this.dataService.save('Job', job);

        const chunkSize = job.chunk_size || handler.chunkSize || 1;
        const stepIndex = job.step_index === 0 ? 0 : job.step_index + chunkSize;
        const stepCount = job.step_count;

        try {
            for (let nextStepIdx = stepIndex; nextStepIdx < stepCount; nextStepIdx += chunkSize) {
                // Check if the job was stopped by another thread/request via the database
                const dbJob = await this.queryService.findOne('Job', job.id) as Job;
                if (dbJob && dbJob.status === 'Stopped') {
                    this.logger.log(`Job ${job.id} (${job.name}) was stopped before step ${nextStepIdx}. Halting execution.`);
                    job.status = 'Stopped';
                    job.status_message = dbJob.status_message || 'Job stopped by user';
                    const endTime = OffsetDateTime.now();
                    job.duration = Duration.between(startTime, endTime).toMillis();
                    await this.dataService.save('Job', job);
                    return job;
                }

                job.step_index = nextStepIdx;
                this.logger.log(`Execute job ${job.id} (${job.name}): step ${nextStepIdx} of ${stepCount} (chunk size: ${chunkSize})`);
                await handler.executeStep(job, nextStepIdx, chunkSize);

                job.duration = Duration.between(startTime, OffsetDateTime.now()).toMillis();
                await this.dataService.save('Job', job);

                // Check if the job was marked as Stopped during chunk execution
                const postStepDbJob = await this.queryService.findOne('Job', job.id) as Job;
                if (postStepDbJob && postStepDbJob.status === 'Stopped') {
                    this.logger.log(`Job ${job.id} (${job.name}) was stopped after step ${nextStepIdx}. Halting execution.`);
                    job.status = 'Stopped';
                    job.status_message = postStepDbJob.status_message || 'Job stopped by user';
                    const endTime = OffsetDateTime.now();
                    job.duration = Duration.between(startTime, endTime).toMillis();
                    await this.dataService.save('Job', job);
                    return job;
                }

                const jobStartTime = OffsetDateTime.parse(job.created_at.toISOString());
                const jobDurationInSeconds = Duration.between(jobStartTime, OffsetDateTime.now()).seconds();
                if (jobDurationInSeconds > JOB_TIMEOUT_IN_SECONDS) {
                    this.logger.error('JOB TIMEOUT EXCEEDED');
                    throw new Error('JOB TIMEOUT EXCEEDED');
                }

                const chunkDurationInSeconds = Duration.between(startTime, OffsetDateTime.now()).seconds();
                if (chunkDurationInSeconds > JOB_CHUNK_DURATION_IN_SECONDS) {
                    this.logger.log('Chunk complete: invoking job again');
                    await this.invokeJob(job.id);
                    return null;
                }
            }

            if (handler.onComplete) {
                const summary = await handler.onComplete(job);
                if (summary !== undefined) {
                    job.result_summary = typeof summary === 'string' ? summary : JSON.stringify(summary);
                }
            }

            const endTime = OffsetDateTime.now();
            job.duration = Duration.between(startTime, endTime).toMillis();
            job.status = "Completed";
            await this.dataService.save('Job', job);
            this.logger.log(`Execute job ${job.id} (${job.name}) completed in ${job.duration}ms`);
            return job;
        } catch (error) {
            const endTime = OffsetDateTime.now();
            job.duration = Duration.between(startTime, endTime).toMillis();
            job.status = "Error";
            job.status_message = error.message ?? String(error);
            await this.dataService.save('Job', job);
            throw error;
        }
    }

    private async executeTaskJob(job: Job, handler: TaskJobHandler): Promise<Job> {
        const startTime = OffsetDateTime.now();
        job.status = "Processing";
        job.status_message = null;
        await this.dataService.save('Job', job);

        let lastSaveTime = Date.now();
        let isStopped = false;
        const ctx: JobExecutionContext = {
            job,
            updateProgress: async (stepIndex: number, stepCount?: number, statusMessage?: string) => {
                const dbJob = await this.queryService.findOne('Job', job.id) as Job;
                if (dbJob && dbJob.status === 'Stopped') {
                    isStopped = true;
                    job.status = 'Stopped';
                    job.status_message = dbJob.status_message || 'Job stopped by user';
                    const endTime = OffsetDateTime.now();
                    job.duration = Duration.between(startTime, endTime).toMillis();
                    await this.dataService.save('Job', job);
                    throw new Error('JOB_STOPPED');
                }

                job.step_index = stepIndex;
                if (stepCount !== undefined) {
                    job.step_count = stepCount;
                }
                if (statusMessage !== undefined) {
                    job.status_message = statusMessage;
                }
                job.duration = Duration.between(startTime, OffsetDateTime.now()).toMillis();
                const now = Date.now();
                if (now - lastSaveTime > 500 || (job.step_count && stepIndex >= job.step_count)) {
                    await this.dataService.save('Job', job);
                    lastSaveTime = now;
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
            job.duration = Duration.between(startTime, endTime).toMillis();
            job.status = "Completed";
            await this.dataService.save('Job', job);
            this.logger.log(`Execute task job ${job.id} (${job.name}) completed in ${job.duration}ms`);
            return job;
        } catch (error) {
            if (isStopped || error.message === 'JOB_STOPPED') {
                this.logger.log(`Execute task job ${job.id} (${job.name}) stopped.`);
                return job;
            }
            const endTime = OffsetDateTime.now();
            job.duration = Duration.between(startTime, endTime).toMillis();
            job.status = "Error";
            job.status_message = error.message ?? String(error);
            await this.dataService.save('Job', job);
            throw error;
        }
    }

    async pollJobStatus(jobId: string): Promise<Job> {
        return await this.queryService.findOne('Job', jobId) as Job;
    }
}
