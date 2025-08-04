import {Injectable} from "@nestjs/common";
import {JobModel} from "./job.model";

@Injectable()
export class JobService {

    async submitJob(payload: any): Promise<JobModel> {
        // create the job in the database with a new id
        // return the job id
        return ;
    }

    async invokeJob(jobId: string): Promise<void> {
        // load the job
        // start processing it
        // update progress into database
        // update final result into database
    }


    async pollJobStatus(jobId: string): Promise<JobModel> {
        // load and return the Job row from the database
        return ;
    }

}