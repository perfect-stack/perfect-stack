import { JobExecutionContext, TaskJobHandler } from '../job/job.model';

export interface BatchJob extends TaskJobHandler {
    getSummary(): Promise<any>;
    execute(context?: JobExecutionContext): Promise<any>;
    showInBatchUI?(): boolean;
}
