import {DataImportConverter} from "./converter.types";
import {QueryService} from "../../query.service";
import {AttributeType, ComparisonOperator} from "../../../domain/meta.entity";
import {Criteria} from "../../query.request";
import {BirdIdConverter} from "./bird-id.converter";


export class BandNumberLookupConverter extends BirdIdConverter implements DataImportConverter {

    constructor(protected readonly queryService: QueryService) {
        super(queryService);
    }

    toCriteria(externalValue: string): Criteria {
        return {
            attributeType: AttributeType.Text,
            operator: ComparisonOperator.InsensitiveStartsWith,
            name: 'band_number',
            value: externalValue
        };
    }
}
