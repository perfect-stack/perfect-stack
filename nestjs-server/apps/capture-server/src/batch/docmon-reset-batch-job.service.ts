import {Injectable, Logger} from "@nestjs/common";
import {BatchJob} from "@perfect-stack/nestjs-server";
import {DataService} from "@perfect-stack/nestjs-server/data/data.service";
import {QueryService} from "@perfect-stack/nestjs-server/data/query.service";

@Injectable()
export class DocMonResetBatchJobService implements BatchJob {
    private readonly logger = new Logger(DocMonResetBatchJobService.name);

    constructor(protected readonly dataService: DataService, protected readonly queryService: QueryService) {}

    async execute(): Promise<any> {
        this.logger.log('DOCMon Reset Batch Job Started');

        try {
            await this.dataService.truncateTable('MonitoringStation');
            this.logger.log('MonitoringStation table truncated successfully.');
        } catch (error) {
            this.logger.error(`Failed to truncate MonitoringStation table: ${error.message}`);
            throw error;
        }

        this.logger.log('DOCMon Reset Batch Job Finished.');
    }

    async getSummary(): Promise<any> {
        return {};
    }
}
