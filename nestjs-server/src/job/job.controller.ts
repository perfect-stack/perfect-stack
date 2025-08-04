import {JobModel} from "./job.model";
import {Controller} from "@nestjs/common";
import {ApiTags} from "@nestjs/swagger";


@ApiTags('data')
@Controller('job')
export class JobController {


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