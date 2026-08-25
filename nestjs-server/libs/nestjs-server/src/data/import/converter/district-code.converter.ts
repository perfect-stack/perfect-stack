import { AttributeValue, ConverterResult, DataImportConverter } from "./converter.types";
import { QueryService } from "../../query.service";
import { Criteria, QueryRequest } from "../../query.request";
import { AttributeType, ComparisonOperator } from "../../../domain/meta.entity";


export class DistrictCodeConverter implements DataImportConverter {

    constructor(protected readonly queryService: QueryService) {}

    toCriteria(line: string): Criteria {
        return {
            attributeType: AttributeType.Text,
            operator: ComparisonOperator.InsensitiveStartsWith,
            name: 'place_title',
            value: line
        };
    }

    protected async findPlace(criteria: Criteria) {
        const queryRequest = new QueryRequest();
        queryRequest.metaEntityName = 'Place';
        queryRequest.criteria = [criteria];

        return await this.queryService.findByCriteria(queryRequest);
    }

    async toAttributeValue(attributeName: string, externalValue: string): Promise<ConverterResult> {
        if (externalValue) {
            const criteria = this.toCriteria(externalValue);
            const queryResponse = await this.findPlace(criteria);
            if (queryResponse.totalCount === 1) {
                const placeSearchResult = queryResponse.resultList[0];
                return {
                    attributeValues: [{
                        name: attributeName,
                        value: placeSearchResult['district_code']
                    }]
                };
            }
            else if (queryResponse.totalCount === 0) {
                return {
                    attributeValues: [{
                        name: attributeName,
                        value: externalValue,
                        error: `No Place found for line: ${externalValue}`
                    }]
                };
            }
            else if (queryResponse.totalCount > 1) {
                return {
                    attributeValues: [{
                        name: attributeName,
                        value: externalValue,
                        error: `More than one Place found for line: ${externalValue}`
                    }]
                };
            }
            else {
                throw new Error(`Unexpected situation total count is negative or otherwise weird: ${queryResponse.totalCount}`);
            }
        }
        else {
            return {
                attributeValues: [{
                    name: attributeName,
                    value: externalValue,
                    error: `No line supplied`
                }]
            };
        }
    }
}
