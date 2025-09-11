import {Injectable, Logger} from "@nestjs/common";
import {BatchJob} from "./batch-job";


@Injectable()
export class BatchService {

    private logger = new Logger(BatchService.name);
    private batchJobMap = new Map<string, BatchJob>();

    addBatchJob(jobName: string, batchJob: BatchJob) {
        if(!this.batchJobMap.has(jobName)) {
            this.batchJobMap.set(jobName, batchJob);
        }
        else {
            throw new Error(`Batch job with name ${jobName} already exists`);
        }
    }

    async getSummary(jobName: string) {
        this.logger.log(`Get summary of batch job: ${jobName}`);
        const batchJob = this.batchJobMap.get(jobName);
        if(batchJob) {
            return batchJob.getSummary();
        }
        else {
            throw new Error(`Unable to find batch job with name ${jobName}`);
        }
    }


    async execute(jobName: string): Promise<any> {
        this.logger.log(`Execute batch job: ${jobName}`);
        const batchJob = this.batchJobMap.get(jobName);
        if(batchJob) {
            return batchJob.execute();
        }
        else {
            throw new Error(`Unable to find batch job with name ${jobName}`);
        }
    }
}