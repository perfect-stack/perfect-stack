import {Job} from "./job.model";
import {Body, Controller, Get, Param, Post} from "@nestjs/common";
import {ApiOperation, ApiResponse, ApiTags} from "@nestjs/swagger";
import {JobService} from "./job.service";
import {ActionPermit} from "../authentication/action-permit";
import {ActionType} from "../domain/meta.role";
import {SubjectName} from "../authentication/subject";

@ApiTags('job')
@Controller('job')
export class JobController {

    constructor(protected readonly jobService: JobService) {}

    @ActionPermit(ActionType.Read)
    @SubjectName('Job')
    @ApiOperation({ summary: 'Get list of registered jobs' })
    @ApiResponse({
        status: 200,
        description: 'The list of registered jobs',
        type: [String],
    })
    @Get('/list')
    async getJobList(): Promise<string[]> {
        return this.jobService.getJobList();
    }

    @ActionPermit(ActionType.Read)
    @SubjectName('Job')
    @ApiOperation({ summary: 'Get summary for a registered job' })
    @ApiResponse({
        status: 200,
        description: 'The summary of the job',
        type: Object,
    })
    @Get('/summary/:jobName')
    async getJobSummary(@Param('jobName') jobName: string): Promise<any> {
        return this.jobService.getJobSummary(jobName);
    }

    @ActionPermit(ActionType.Read)
    @SubjectName('Job')
    @ApiOperation({ summary: 'Get latest execution for a registered job' })
    @ApiResponse({
        status: 200,
        description: 'The latest execution of the job',
        type: Object,
    })
    @Get('/latest/:jobName')
    async getLatestJob(@Param('jobName') jobName: string): Promise<Job | null> {
        return this.jobService.getLatestJob(jobName);
    }

    @ActionPermit(ActionType.Edit)
    @SubjectName('Job')
    @ApiOperation({ summary: 'Start a registered job' })
    @ApiResponse({
        status: 201,
        description: 'The created and started job',
        type: Object,
    })
    @Post('/start/:jobName')
    async startJob(@Param('jobName') jobName: string, @Body() payload: any): Promise<Job> {
        return this.jobService.startJob(jobName, payload);
    }

    @ActionPermit(ActionType.Edit)
    @SubjectName('Job')
    @ApiOperation({ summary: 'Stop a running job' })
    @ApiResponse({
        status: 200,
        description: 'The stopped job',
        type: Object,
    })
    @Post('/stop/:jobId')
    async stopJob(@Param('jobId') jobId: string): Promise<Job> {
        return this.jobService.stopJob(jobId);
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
        return this.jobService.pollJobStatus(jobId);
    }
}
