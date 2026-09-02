import { AttributeValue, ConverterResult, DataImportConverter, DataListImportConverter, ExternalValue } from "./converter.types";
import { QueryService } from "../../query.service";
import { Criteria, QueryRequest } from "../../query.request";
import { AttributeType, ComparisonOperator } from "../../../domain/meta.entity";


export class DistrictCodeConverter implements DataListImportConverter, DataImportConverter {

    constructor(protected readonly queryService: QueryService) {}

    toCriteria(line: string): Criteria {
        return {
            attributeType: AttributeType.Text,
            operator: ComparisonOperator.Equals,
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

    async toAttributeValueFromExternalValueList(attributeName: string, externalValueList: ExternalValue[]): Promise<ConverterResult> {
        const districtCodeVal = externalValueList.find(e => e.name === 'District Code')?.value ?? externalValueList[0]?.value;
        const existingLineVal = externalValueList.find(e => e.name === 'Existing Line')?.value ?? externalValueList[1]?.value;

        // If there is a value in the "District Code" column, then use that
        if (districtCodeVal && districtCodeVal.trim() !== '') {
            return {
                attributeValues: [{
                    name: attributeName,
                    value: districtCodeVal.trim()
                }]
            };
        }

        // Else use the name found in "Existing Line" to do a lookup of "Place" and use the district code for that place
        if (existingLineVal && existingLineVal.trim() !== '') {
            const criteria = this.toCriteria(existingLineVal.trim());
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
                        value: existingLineVal,
                        error: `No Place can be found for the Existing Line: ${existingLineVal}`
                    }]
                };
            }
            else if (queryResponse.totalCount > 1) {
                return {
                    attributeValues: [{
                        name: attributeName,
                        value: existingLineVal,
                        error: `More than one Place found for Existing Line: ${existingLineVal}`
                    }]
                };
            }
            else {
                throw new Error(`Unexpected situation total count is negative or otherwise weird: ${queryResponse.totalCount}`);
            }
        }

        // Else if neither District Code nor Existing Line is provided
        return {
            attributeValues: [{
                name: attributeName,
                value: null,
                error: `No District Code or Existing Line supplied`
            }]
        };
    }

    async toAttributeValue(attributeName: string, externalValue: string): Promise<ConverterResult> {
        if (externalValue && externalValue.trim() !== '') {
            return {
                attributeValues: [{
                    name: attributeName,
                    value: externalValue.trim()
                }]
            };
        }
        else {
            return {
                attributeValues: [{
                    name: attributeName,
                    value: null,
                    error: `No District Code supplied`
                }]
            };
        }
    }
}
