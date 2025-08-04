import {Injectable} from "@nestjs/common";
import {Job} from "./job.model";
import {DataService} from "../data/data.service";
import {QueryService} from "../data/query.service";
import {DataImportService} from "../data/import/data-import.service";
import {Duration, OffsetDateTime} from "@js-joda/core";


@Injectable()
export class JobService {

    constructor(protected readonly dataService: DataService,
                protected readonly queryService: QueryService,
                protected readonly dataImportService: DataImportService) {}

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
        const startTime = OffsetDateTime.now();

        // load the job
        const job = await this.queryService.findOne('Job', jobId) as Job;

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
                    const dataImportModel = JSON.parse(job.data)
                    await this.dataImportService.dataImportValidate(nextStepIdx, dataImportModel);
                    job.data = JSON.stringify(dataImportModel);
                    break;

                case 'Data Import - Import':
                    break;

                default:
                    throw new Error(`Unknown job of ${jobName}`);
            }

            job.step_index = nextStepIdx;

            // Every n items update progress
            await this.dataService.save('Job', job);
        }

        // update progress into database
        // update final result into database
        const endTime = OffsetDateTime.now();

        // duration is in milliseconds...
        job.duration = Duration.between(startTime, endTime).toMillis();
        job.status = "Completed";
        await this.dataService.save('Job', job);

        return job;
    }


    async pollJobStatus(jobId: string): Promise<Job> {
        // load and return the Job row from the database
        return await this.queryService.findOne('Job', jobId) as Job;
    }

}