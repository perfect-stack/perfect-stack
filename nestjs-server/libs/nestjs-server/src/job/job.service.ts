import {Injectable, Logger} from "@nestjs/common";
import {Job} from "./job.model";
import {DataService} from "../data/data.service";
import {QueryService} from "../data/query.service";
import {DataImportService} from "../data/import/data-import.service";
import {Duration, OffsetDateTime} from "@js-joda/core";
import {ConfigService} from "@nestjs/config";
import {InvokeCommand, LambdaClient} from "@aws-sdk/client-lambda";
import {EventEmitter2, OnEvent} from "@nestjs/event-emitter";

const JOB_TIMEOUT_IN_SECONDS = 60 * 60;
const JOB_CHUNK_DURATION_IN_SECONDS= 5 + 60;


@Injectable()
export class JobService {
    private readonly logger = new Logger(JobService.name);

    jobProcessingMode: string;

    constructor(
        protected readonly configService: ConfigService,
        protected readonly dataService: DataService,
        protected readonly queryService: QueryService,
        protected readonly dataImportService: DataImportService,
        protected readonly eventEmitter: EventEmitter2) {

        this.jobProcessingMode = configService.get('JOB_PROCESSING_MODE', 'async');
    }

    async submitJob(name: string, stepCount: number, payload: any): Promise<Job> {
        // create the job in the database with a new id
        // return the job id

        const job: Job = {
            id: '',
            name: name,
            status: "Submitted",
            duration: 0,
            data: JSON.stringify(payload),
            step_index: 0,
            step_count: stepCount,
            created_at: null,
            updated_at: null,
        }

        const entityResponse = await this.dataService.save('Job', job)
        return entityResponse.entity as Job;
    }

    async invokeJob(jobId: string) {
        switch (this.jobProcessingMode) {
            case 'sync':
                // Wait for the Job result from invoking the Job and return that
                return await this.executeJob(jobId);
            case 'local-async':
                this.eventEmitter.emit('job.invoke.local-async', jobId);
                break;
            case 'async':
                // Invoke the lambda - but don't wait for the result (the await here, is just for the lambda request)
                await this.invokeJobLambda(jobId);
                break;
            default:
                throw new Error(`Invalid job processing mode: ${this.jobProcessingMode}`);
        }
    }

    private async invokeJobLambda(jobId: string) {

        this.logger.log(`Invoking Lambda: for job ID: ${jobId}`);

        const payload = {
            jobId
        };

        const envName = this.configService.get('ENV_NAME', null);
        if(!envName) {
            throw new Error(`ENV_NAME environment variable is not set. Cannot determine Lambda function name.`);
        }

        const lambdaFunctionName = `${envName}-kims-docker-function`;
        const command = new InvokeCommand({
            FunctionName: lambdaFunctionName,
            InvocationType: 'Event', // For asynchronous invocation
            Payload: JSON.stringify(payload),
        });

        const lambdaClient = new LambdaClient();
        await lambdaClient.send(command);

        this.logger.log('Invoking Lambda: invocation completed');
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
        // Start the job
        this.logger.log(`Invoke job: ${jobId}`);
        const startTime = OffsetDateTime.now();

        // load the job
        const job = await this.queryService.findOne('Job', jobId) as Job;

        this.logger.log(`Invoke job: loaded Job ${job.name}`);

        job.status = "Processing";
        const jobName = job.name;
        const stepIndex = job.step_index === 0 ? 0 : job.step_index + 1;
        const stepCount = job.step_count;

        // start processing it
        // get the number of work items
        // for each work item
        for(let nextStepIdx = stepIndex; nextStepIdx < stepCount; nextStepIdx++) {

            job.step_index = nextStepIdx;
            this.logger.log(`Invoke job: step number ${nextStepIdx} of ${stepCount}`);
            await this.executeJobStep(job, nextStepIdx);

            // Every n items update progress
            if (nextStepIdx % 10 === 0) {
                await this.dataService.save('Job', job);

                const jobStartTime = OffsetDateTime.parse(job.created_at.toISOString());
                const jobDurationInSeconds = Duration.between(jobStartTime, OffsetDateTime.now()).seconds();
                if(jobDurationInSeconds > JOB_TIMEOUT_IN_SECONDS) {
                    this.logger.error('JOB TIMEOUT EXCEEDED');
                    throw new Error('JOB TIMEOUT EXCEEDED');
                }

                const chunkDurationInSeconds = Duration.between(startTime, OffsetDateTime.now()).seconds();
                if(chunkDurationInSeconds > JOB_CHUNK_DURATION_IN_SECONDS) {
                    this.logger.log('Chunk complete: invoking job again');
                    this.invokeJob(jobId)
                    return null;
                }
            }

            if (this.jobProcessingMode === 'local-async') {
                // Simple delay function - Used for Dev/Test purposes when running locally to simulate async behaviours
                const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
                await delay(100);
                this.logger.log(`Delay finished. Invoking jobService for job ID: ${job.id}`);
            }
        }

        this.logger.log(`Invoke job: processed ${stepCount} steps`);

        switch (jobName) {
            case 'Data Import - Validate':
                const d1 = JSON.parse(job.data)
                d1.status = 'validated';
                job.data = JSON.stringify(d1);
                break;
            case 'Data Import - Import':
                const d2 = JSON.parse(job.data)
                d2.status = 'imported';
                job.data = JSON.stringify(d2);
                break;
            default:
                throw new Error(`Unknown job of ${jobName}`);
        }

        // update progress into database
        // update final result into database
        const endTime = OffsetDateTime.now();

        // duration is in milliseconds...
        job.duration = Duration.between(startTime, endTime).toMillis();
        job.status = "Completed";
        await this.dataService.save('Job', job);

        this.logger.log(`Invoke job: all finished now`);

        return job;
    }

    async executeJobStep(job: Job, stepIdx: number) {
        // Do the work
        switch (job.name) {
            case 'Data Import - Validate':
                const d1 = JSON.parse(job.data)
                await this.dataImportService.dataImportValidate(stepIdx, d1);
                job.data = JSON.stringify(d1);
                break;

            case 'Data Import - Import':
                const d2 = JSON.parse(job.data)
                await this.dataImportService.dataImportImport(stepIdx, d2);
                job.data = JSON.stringify(d2);
                break;

            default:
                throw new Error(`Unknown job of ${job.name}`);
        }
    }


    async pollJobStatus(jobId: string): Promise<Job> {
        // load and return the Job row from the database
        return await this.queryService.findOne('Job', jobId) as Job;
    }

}