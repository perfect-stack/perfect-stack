import {CheckForDuplicates, DuplicateCheckAction, DuplicateCheckResult} from "./data-import.service";
import {Entity} from "../../domain/entity";
import {Injectable} from "@nestjs/common";
import {QueryService} from "../query.service";
import {QueryRequest} from "../query.request";
import {AttributeType, ComparisonOperator} from "../../domain/meta.entity";


@Injectable()
export class DuplicateMonitoringStationCheck implements CheckForDuplicates {

    constructor(protected readonly queryService: QueryService) {}

    async checkForDuplicates(headers: string[], entity: Entity, duplicateCheckList: string[]): Promise<DuplicateCheckResult> {

        const station_name = entity['station_title'];
        let cellNumber = headers.indexOf('Station Name');
        if (cellNumber < 0) {
            cellNumber = headers.indexOf('station_title');
        }
        if (cellNumber < 0) {
            cellNumber = 0;
        }

        if(station_name) {
            const importSetKey = `${station_name}`;

            if(duplicateCheckList.includes(importSetKey)) {
                return new DuplicateCheckResult(DuplicateCheckAction.DUPLICATE_IN_FILE_IGNORE, cellNumber);
            }

            const queryResponse = await this.findByCriteria(station_name);
            const dbDuplicate = queryResponse && queryResponse.totalCount > 0 ? DuplicateCheckAction.DUPLICATE_IN_DB_ERROR : DuplicateCheckAction.NOT_A_DUPLICATE;
            if(dbDuplicate === DuplicateCheckAction.NOT_A_DUPLICATE) {
                duplicateCheckList.push(importSetKey);
            }
            return new DuplicateCheckResult(dbDuplicate, cellNumber);
        }
        else {
            return new DuplicateCheckResult(DuplicateCheckAction.UNABLE_TO_DETERMINE, cellNumber);
        }
    }

    private async findByCriteria(station_name: any) {
        const queryRequest = new QueryRequest();
        queryRequest.metaEntityName = 'MonitoringStation';
        queryRequest.criteria = [];

        queryRequest.criteria.push({
            attributeType: AttributeType.Text,
            operator: ComparisonOperator.Equals,
            name: 'station_title',
            value: station_name
        });

        return this.queryService.findByCriteria(queryRequest);
    }
}
