import { Injectable, Logger } from '@nestjs/common';
import { CustomQuery } from '../data/custom-query.service';
import { QueryRequest } from '../data/query.request';
import { QueryResponse } from '../data/query.response';
import { JobService } from './job.service';

@Injectable()
export class JobSearchQuery implements CustomQuery {
    private readonly logger = new Logger(JobSearchQuery.name);

    constructor(protected readonly jobService: JobService) {}

    async findByCriteria(queryRequest: QueryRequest): Promise<QueryResponse<any>> {
        let statusList: string[] | undefined;
        let filename: string | undefined;
        let executedBy: string | undefined;
        let dataFormat: string | undefined;
        let textSearch: string | undefined;

        if (queryRequest.criteria && queryRequest.criteria.length > 0) {
            for (const crit of queryRequest.criteria) {
                if (crit.value === undefined || crit.value === null || crit.value === '') {
                    continue;
                }
                const name = crit.name;
                const val = String(crit.value).trim();
                if (name === 'status') {
                    statusList = [val];
                } else if (name === 'filename') {
                    filename = val;
                } else if (name === 'executed_by') {
                    executedBy = val;
                } else if (name === 'data_format') {
                    dataFormat = val;
                } else if (name === 'search' || name === 'textSearch') {
                    textSearch = val;
                }
            }
        }

        const res = await this.jobService.searchJobs({
            pageNumber: queryRequest.pageNumber || 1,
            pageSize: queryRequest.pageSize || 50,
            statusList,
            filename,
            executedBy,
            dataFormat,
            textSearch,
            jobNames: ['Data Import - Import', 'Data Import - Validate'],
        });

        return {
            totalCount: res.totalCount,
            resultList: res.resultList,
        };
    }
}
