import {CheckForDuplicates, DuplicateCheckAction, DuplicateCheckResult} from "./data-import.service";
import {Entity} from "../../domain/entity";
import {Injectable} from "@nestjs/common";
import {QueryService} from "../query.service";
import {QueryRequest} from "../query.request";
import {AttributeType, ComparisonOperator} from "../../domain/meta.entity";


@Injectable()
export class DuplicatePlaceCheck implements CheckForDuplicates {

    constructor(protected readonly queryService: QueryService) {}

    async checkForDuplicates(headers: string[], entity: Entity, duplicateCheckList: string[]): Promise<DuplicateCheckResult> {

        const place_name = entity['place_title'];
        let cellNumber = headers.indexOf('Line Name');
        if (cellNumber < 0) {
            cellNumber = headers.indexOf('place_title');
        }
        if (cellNumber < 0) {
            cellNumber = 0;
        }

        if(place_name) {
            const importSetKey = `${place_name}`;

            if(duplicateCheckList.includes(importSetKey)) {
                return new DuplicateCheckResult(DuplicateCheckAction.DUPLICATE_IN_FILE_IGNORE, cellNumber);
            }

            const queryResponse = await this.findByCriteria(place_name);
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

    private async findByCriteria(place_name: any) {
        const queryRequest = new QueryRequest();
        queryRequest.metaEntityName = 'Place';
        queryRequest.criteria = [];

        queryRequest.criteria.push({
            attributeType: AttributeType.Text,
            operator: ComparisonOperator.Equals,
            name: 'place_title',
            value: place_name
        });

        return this.queryService.findByCriteria(queryRequest);
    }
}
