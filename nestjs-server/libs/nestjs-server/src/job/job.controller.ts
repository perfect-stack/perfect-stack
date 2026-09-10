import {Job} from "./job.model";
import {Controller, Get, Param} from "@nestjs/common";
import {ApiOperation, ApiResponse, ApiTags} from "@nestjs/swagger";
import {JobService} from "./job.service";
import {ActionPermit} from "../authentication/action-permit";
import {ActionType} from "../domain/meta.role";
import {SubjectName} from "../authentication/subject";


@ApiTags('job')
@Controller('job')
export class JobController {

    constructor(protected readonly jobService: JobService) {
    }


    @ActionPermit(ActionType.Read)
    @SubjectName('Job')
    @ApiOperation({ summary: 'Poll for the supplied Job current status' })
    @ApiResponse({
        status: 200,
        description: 'The job status',
        type: Object,
    })
    @Get('/:jobId')
    async pollJobStatus(@Param('jobId') jobId: string): Promise<Job> {
        // load and return the Job row from the database
        return this.jobService.pollJobStatus(jobId);
    }
}