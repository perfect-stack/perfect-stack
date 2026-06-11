import {Controller, Get, Param, Post} from "@nestjs/common";
import {ApiOperation, ApiResponse, ApiTags} from "@nestjs/swagger";
import {ActionPermit} from "../authentication/action-permit";
import {ActionType} from "../domain/meta.role";
import {SubjectName} from "../authentication/subject";
import {BatchService} from "./batch.service";

@ApiTags('batch')
@Controller('batch')
export class BatchController {


    constructor(protected readonly batchService: BatchService) {}

    @ActionPermit(ActionType.Read)
    @SubjectName('Batch')
    @ApiOperation({
        summary: 'Get list of batch jobs',
    })
    @ApiResponse({
        status: 200,
        description: 'The list of batch jobs',
        type: [String],
    })
    @Get('/list')
    async getList(): Promise<String[]> {
        return this.batchService.getList();
    }

    @ActionPermit(ActionType.Read)
    @SubjectName('Batch')
    @ApiOperation({
        summary: 'Get summary of batch job',
    })
    @ApiResponse({
        status: 200,
        description: 'The summary of the batch job',
        type: Object,
    })
    @Get('/:jobName')
    async getSummary(@Param('jobName') jobName: string): Promise<any> {
        return this.batchService.getSummary(jobName);
    }

    @ActionPermit(ActionType.Edit)
    @SubjectName('Batch')
    @ApiOperation({
        summary: 'Execute batch job',
    })
    @ApiResponse({
        status: 201,
        description: 'Batch job executed',
        type: Object,
    })
    @Post('/:jobName')
    async execute(@Param('jobName') jobName: string): Promise<any> {
        return this.batchService.execute(jobName);
    }
}