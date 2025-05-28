import {Injectable, Logger} from "@nestjs/common";


@Injectable()
export class TaskService {
    private readonly logger = new Logger(TaskService.name);

    async handleDailyTask(payload: any): Promise<string> {
        this.logger.log(`Handling daily task with payload: ${JSON.stringify(payload)}`);
        // Your actual task logic here
        // e.g., database cleanup, report generation, calling other services
        return 'Daily task processed successfully.';
    }
}