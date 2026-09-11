import {Injectable, Logger} from "@nestjs/common";
import {Job, JobExecutionContext, JobHandler, StepJobHandler, TaskJobHandler} from "./job.model";
import {DataService} from "../data/data.service";
import {QueryService} from "../data/query.service";
import {Duration, OffsetDateTime} from "@js-joda/core";
import {ConfigService} from "@nestjs/config";
import {EventEmitter2, OnEvent} from "@nestjs/event-emitter";
import {EventBridgeClient, PutEventsCommand, PutEventsCommandInput} from "@aws-sdk/client-eventbridge";

const JOB_TIMEOUT_IN_SECONDS = 60 * 60;
const JOB_CHUNK_DURATION_IN_SECONDS = 5 + 60;

@Injectable()
export class JobService {
    private readonly logger = new Logger(JobService.name);
    private readonly jobHandlers = new Map<string, JobHandler>();

    jobProcessingMode: string;

    constructor(
        protected readonly configService: ConfigService,
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

    async startJob(name: string, payload: any = null, stepCount: number = 1): Promise<Job> {
        const handler = this.jobHandlers.get(name);
        if (!handler) {
            throw new Error(`Unable to find job handler for '${name}'`);
        }
        const job = await this.submitJob(name, stepCount, payload);
        await this.invokeJob(job.id);
        return job;
    }

    async submitJob(name: string, stepCount: number, payload: any): Promise<Job> {
        const job: Job = {
            id: '',
            name: name,
            status: "Submitted",
            status_message: null,
            duration: 0,
            data: payload ? (typeof payload === 'string' ? payload : JSON.stringify(payload)) : null,
            step_index: 0,
            step_count: stepCount,
            created_at: null,
            updated_at: null,
        };

        const entityResponse = await this.dataService.save('Job', job);
        return entityResponse.entity as Job;
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
        const stepIndex = job.step_index === 0 ? 0 : job.step_index + 1;
        const stepCount = job.step_count;

        try {
            for (let nextStepIdx = stepIndex; nextStepIdx < stepCount; nextStepIdx++) {
                job.step_index = nextStepIdx;
                this.logger.log(`Execute job ${job.id} (${job.name}): step ${nextStepIdx} of ${stepCount}`);
                await handler.executeStep(job, nextStepIdx);

                if (nextStepIdx % 10 === 0) {
                    await this.dataService.save('Job', job);

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

                if (this.jobProcessingMode === 'local-async') {
                    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
                    await delay(100);
                }
            }

            if (handler.onComplete) {
                await handler.onComplete(job);
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
        const ctx: JobExecutionContext = {
            job,
            updateProgress: async (stepIndex: number, stepCount?: number, statusMessage?: string) => {
                job.step_index = stepIndex;
                if (stepCount !== undefined) {
                    job.step_count = stepCount;
                }
                if (statusMessage !== undefined) {
                    job.status_message = statusMessage;
                }
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
