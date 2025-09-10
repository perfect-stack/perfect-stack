import {CheckForDuplicates, DuplicateCheckAction} from "./data-import.service";
import {Entity} from "../../domain/entity";
import {Injectable} from "@nestjs/common";
import {QueryService} from "../query.service";
import {QueryRequest} from "../query.request";
import {AttributeType, ComparisonOperator} from "../../domain/meta.entity";
import {OffsetDateTime} from "@js-joda/core";


@Injectable()
export class DuplicateEventCheck implements CheckForDuplicates {

    constructor(protected readonly queryService: QueryService) {}

    async checkForDuplicates(entity: Entity, duplicateCheckList: string[]): Promise<DuplicateCheckAction> {

        const bird_id = entity['bird_id'];
        const event_type = entity['event_type'];
        const date_time = entity['date_time'];

        if(bird_id && event_type && date_time) {

            const dateWithoutTime = OffsetDateTime.parse(date_time).toLocalDate().toString();
            const importSetKey = `${bird_id}|${event_type}|${dateWithoutTime}`;

            if(duplicateCheckList.includes(importSetKey)) {
                return DuplicateCheckAction.DUPLICATE_IN_FILE_IGNORE;
            }

            const queryResponse = await this.findByCriteria(bird_id, event_type, date_time);
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

    private async findByCriteria(bird_id: any, event_type: any, date_time: any) {
        const queryRequest = new QueryRequest();
        queryRequest.metaEntityName = 'Event';
        queryRequest.criteria = [];

        queryRequest.criteria.push({
            attributeType: AttributeType.Identifier,
            operator: ComparisonOperator.Equals,
            name: 'bird_id',
            value: bird_id
        });

        queryRequest.criteria.push({
            attributeType: AttributeType.Enumeration,
            operator: ComparisonOperator.Equals,
            name: 'event_type',
            value: event_type
        });

        queryRequest.criteria.push({
            attributeType: AttributeType.DateTime,
            operator: ComparisonOperator.Equals,
            name: 'date_time',
            value: date_time
        });

        return this.queryService.findByCriteria(queryRequest);
    }
}