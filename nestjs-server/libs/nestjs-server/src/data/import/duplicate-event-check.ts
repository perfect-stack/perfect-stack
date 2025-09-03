import {CheckForDuplicates} from "./data-import.service";
import {Entity} from "../../domain/entity";
import {Injectable} from "@nestjs/common";
import {QueryService} from "../query.service";
import {QueryRequest} from "../query.request";
import {AttributeType, ComparisonOperator} from "../../domain/meta.entity";


@Injectable()
export class DuplicateEventCheck implements CheckForDuplicates {

    constructor(protected readonly queryService: QueryService) {}

    async checkForDuplicates(entity: Entity): Promise<boolean> {

        const bird_id = entity['bird_id'];
        const event_type = entity['event_type'];
        const date_time = entity['date_time'];

        if(bird_id && event_type && date_time) {
            const queryResponse = await this.findByCriteria(bird_id, event_type, date_time);
            return queryResponse && queryResponse.totalCount > 0;
        }
        else {
            throw new Error('Unable to determine if entity had duplicates');
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