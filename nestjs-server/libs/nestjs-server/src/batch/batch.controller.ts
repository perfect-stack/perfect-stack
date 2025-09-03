import {Controller, Get, Param, Post} from "@nestjs/common";
import {ApiOperation, ApiTags} from "@nestjs/swagger";
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
        summary: 'Get summary of batch job',
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
    @Post('/:jobName')
    async execute(@Param('jobName') jobName: string): Promise<any> {
        return this.batchService.execute(jobName);
    }
}