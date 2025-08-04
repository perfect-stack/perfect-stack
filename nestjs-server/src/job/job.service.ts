import {Injectable} from "@nestjs/common";
import {Job} from "./job.model";
import {DataService} from "../data/data.service";
import {QueryService} from "../data/query.service";


@Injectable()
export class JobService {

    constructor(protected readonly dataService: DataService,
                protected readonly queryService: QueryService) {}

    async submitJob(payload: any): Promise<Job> {
        // create the job in the database with a new id
        // return the job id

        const job: Job = {
            id: '',
            status: "Submitted",
            duration: 0,
            request: JSON.stringify(payload),
            response: null,
            progress: 0,
            created_at: '',
            updated_at: '',
        }

        const entityResponse = await this.dataService.save('Job', job)

        return entityResponse.entity as Job;
    }

    async invokeJob(jobId: string): Promise<void> {
        // load the job
        // start processing it
        // update progress into database
        // update final result into database
    }


    async pollJobStatus(jobId: string): Promise<Job> {
        // load and return the Job row from the database
        return await this.queryService.findOne('Job', jobId) as Job;
    }

}