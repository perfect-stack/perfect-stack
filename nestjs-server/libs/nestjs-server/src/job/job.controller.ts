import {Job} from "./job.model";
import {Controller, Get, Param} from "@nestjs/common";
import {ApiOperation, ApiTags} from "@nestjs/swagger";
import {JobService} from "./job.service";
import {ActionPermit} from "../authentication/action-permit";
import {ActionType} from "../domain/meta.role";
import {SubjectKey} from "../authentication/subject";


@ApiTags('job')
@Controller('job')
export class JobController {

    constructor(protected readonly jobService: JobService) {
    }

    async submitJob(payload: any): Promise<Job> {
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


    @ActionPermit(ActionType.Read)
    @SubjectKey('Job')
    @ApiOperation({ summary: 'Poll for the supplied Job current status' })
    @Get('/:jobId')
    async pollJobStatus(@Param('jobId') jobId: string): Promise<Job> {
        // load and return the Job row from the database
        return this.jobService.pollJobStatus(jobId);
    }
}