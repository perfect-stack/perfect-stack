import {Controller, Param, Post} from "@nestjs/common";
import {ApiOperation, ApiTags} from "@nestjs/swagger";
import {ActionPermit} from "@app/authentication/action-permit";
import {ActionType} from "@app/domain/meta.role";
import {SubjectName} from "@app/authentication/subject";
import {BatchService} from "@app/batch/batch.service";

@ApiTags('batch')
@Controller('batch')
export class BatchController {


    constructor(protected readonly batchService: BatchService) {}

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