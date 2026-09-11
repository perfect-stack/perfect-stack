import {Injectable, Logger} from "@nestjs/common";
import {BatchJob} from "./batch-job";
import {JobService} from "../job/job.service";

@Injectable()
export class BatchService {

    private logger = new Logger(BatchService.name);

    constructor(protected readonly jobService: JobService) {}

    getList(): string[] {
        return this.jobService.getJobList();
    }

    addBatchJob(jobName: string, batchJob: BatchJob) {
        this.jobService.registerJob(jobName, batchJob);
    }

    async getSummary(jobName: string) {
        this.logger.log(`Get summary of batch job: ${jobName}`);
        return this.jobService.getJobSummary(jobName);
    }

    async execute(jobName: string): Promise<any> {
        this.logger.log(`Execute batch job: ${jobName}`);
        return this.jobService.startJob(jobName);
    }
}
