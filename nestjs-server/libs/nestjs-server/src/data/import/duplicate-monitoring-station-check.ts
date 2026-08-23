import {CheckForDuplicates, DuplicateCheckAction} from "./data-import.service";
import {Entity} from "../../domain/entity";
import {Injectable} from "@nestjs/common";
import {QueryService} from "../query.service";
import {QueryRequest} from "../query.request";
import {AttributeType, ComparisonOperator} from "../../domain/meta.entity";


@Injectable()
export class DuplicateMonitoringStationCheck implements CheckForDuplicates {

    constructor(protected readonly queryService: QueryService) {}

    async checkForDuplicates(entity: Entity, duplicateCheckList: string[]): Promise<DuplicateCheckAction> {

        const station_name = entity['station_title'];

        if(station_name) {
            const importSetKey = `${station_name}`;

            if(duplicateCheckList.includes(importSetKey)) {
                return DuplicateCheckAction.DUPLICATE_IN_FILE_IGNORE;
            }

            const queryResponse = await this.findByCriteria(station_name);
            const dbDuplicate = queryResponse && queryResponse.totalCount > 0 ? DuplicateCheckAction.DUPLICATE_IN_DB_ERROR : DuplicateCheckAction.NOT_A_DUPLICATE;
            if(dbDuplicate === DuplicateCheckAction.NOT_A_DUPLICATE) {
                duplicateCheckList.push(importSetKey);
            }
            return dbDuplicate;
        }
        else {
            return DuplicateCheckAction.UNABLE_TO_DETERMINE;
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
