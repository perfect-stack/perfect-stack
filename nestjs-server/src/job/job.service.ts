import {Injectable, Logger} from "@nestjs/common";
import {Job} from "./job.model";
import {DataService} from "../data/data.service";
import {QueryService} from "../data/query.service";
import {DataImportService} from "../data/import/data-import.service";
import {Duration, OffsetDateTime} from "@js-joda/core";
import {ConfigService} from "@nestjs/config";


@Injectable()
export class JobService {
    private readonly logger = new Logger(JobService.name);

    jobProcessingMode: string;

    constructor(
        protected readonly configService: ConfigService,
        protected readonly dataService: DataService,
        protected readonly queryService: QueryService,
        protected readonly dataImportService: DataImportService) {

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
            created_at: '',
            updated_at: '',
        }

        const entityResponse = await this.dataService.save('Job', job)
        return entityResponse.entity as Job;
    }

    async invokeJob(jobId: string): Promise<Job> {
        // Start the job
        this.logger.log(`Invoke job: ${jobId}`);
        const startTime = OffsetDateTime.now();

        // load the job
        const job = await this.queryService.findOne('Job', jobId) as Job;

        this.logger.log(`Invoke job: loaded Job ${job.name}`);

        job.status = "Processing";
        const jobName = job.name;
        const stepIndex = job.step_index;
        const stepCount = job.step_count;

        // start processing it
        // get the number of work items
        // for each work item
        for(let nextStepIdx = stepIndex; nextStepIdx < stepCount; nextStepIdx++) {

            // Do the work
            switch (jobName) {
                case 'Data Import - Validate':
                    const d1 = JSON.parse(job.data)
                    await this.dataImportService.dataImportValidate(nextStepIdx, d1);
                    job.data = JSON.stringify(d1);
                    break;

                case 'Data Import - Import':
                    const d2 = JSON.parse(job.data)
                    await this.dataImportService.dataImportImport(nextStepIdx, d2);
                    job.data = JSON.stringify(d2);
                    break;

                default:
                    throw new Error(`Unknown job of ${jobName}`);
            }

            job.step_index = nextStepIdx;

            this.logger.log(`Invoke job: step number ${nextStepIdx} of ${stepCount}`);

            // Every n items update progress
            if (nextStepIdx % 10 === 0) {
                await this.dataService.save('Job', job);
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


    async pollJobStatus(jobId: string): Promise<Job> {
        // load and return the Job row from the database
        return await this.queryService.findOne('Job', jobId) as Job;
    }

}