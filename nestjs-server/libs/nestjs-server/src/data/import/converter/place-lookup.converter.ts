import { AttributeValue, ConverterResult, DataImportConverter } from "./converter.types";
import { QueryService } from "../../query.service";
import { Criteria, QueryRequest } from "../../query.request";
import { AttributeType, ComparisonOperator } from "../../../domain/meta.entity";


export class PlaceLookupConverter implements DataImportConverter {

    constructor(protected readonly queryService: QueryService) {}

    toCriteria(placeTitle: string): Criteria {
        return {
            attributeType: AttributeType.Text,
            operator: ComparisonOperator.Equals,
            name: 'place_title',
            value: placeTitle
        };
    }

    protected async findPlace(criteria: Criteria) {
        const queryRequest = new QueryRequest();
        queryRequest.metaEntityName = 'Place';
        queryRequest.criteria = [criteria];

        return await this.queryService.findByCriteria(queryRequest);
    }

    protected extractAttributeValues(placeSearchResult: any): AttributeValue[] {
        return [
            {
                name: 'place_id',
                value: placeSearchResult['id']
            }
        ];
    }

    async toAttributeValue(attributeName: string, externalValue: string): Promise<ConverterResult> {
        if (externalValue && externalValue.trim() !== '') {
            const criteria = this.toCriteria(externalValue.trim());
            const queryResponse = await this.findPlace(criteria);
            if (queryResponse.totalCount === 1) {
                return {
                    attributeValues: this.extractAttributeValues(queryResponse.resultList[0])
                };
            }
            else if (queryResponse.totalCount === 0) {
                return {
                    attributeValues: [{
                        name: attributeName,
                        value: externalValue,
                        error: `No Place found for Line Name: ${externalValue}`
                    }]
                };
            }
            else if (queryResponse.totalCount > 1) {
                return {
                    attributeValues: [{
                        name: attributeName,
                        value: externalValue,
                        error: `More than one Place found for Line Name: ${externalValue}`
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
                    error: `No Line Name supplied`
                }]
            };
        }
    }
}
