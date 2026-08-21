import {DataImportConverter} from "./converter.types";
import {QueryService} from "../../query.service";
import {Criteria} from "../../query.request";
import {BirdIdConverter} from "./bird-id.converter";
import {AttributeType, ComparisonOperator} from "../../../domain/meta.entity";


export class MicrochipConverter extends BirdIdConverter implements DataImportConverter {


    constructor(protected readonly queryService: QueryService) {
        super(queryService);
    }

    toCriteria(externalValue: string): Criteria {
        return {
            attributeType: AttributeType.Text,
            operator: ComparisonOperator.InsensitiveLike,
            name: 'microchip',
            value: externalValue
        };
    }
}
