import {AttributeValue, DataImportConverter} from "@perfect-stack/nestjs-server/data/import/converter/converter.types";
import {QueryService} from "@perfect-stack/nestjs-server";
import {Criteria, QueryRequest} from "@perfect-stack/nestjs-server/data/query.request";
import {AttributeType, ComparisonOperator} from "@perfect-stack/nestjs-server/domain/meta.entity";


export class LocationNameConverter implements DataImportConverter {

    constructor(protected readonly queryService: QueryService) {}

    toCriteria(locationName: string): Criteria {
        return {
            attributeType: AttributeType.Text,
            operator: ComparisonOperator.InsensitiveStartsWith,
            name: 'location_name',
            value: locationName
        };
    }

    protected async findLocation(criteria: Criteria) {

        const queryRequest = new QueryRequest();
        queryRequest.metaEntityName = 'Location';
        queryRequest.criteria = [criteria];

        return await this.queryService.findByCriteria(queryRequest);
    }

    protected extractAttributeValues(locationSearchResult: any): AttributeValue[] {
        // TODO: (MBDP-358) If we add location_description to Event then we will need to update this code below
        return [
            {
                name: 'northing',
                value: locationSearchResult['northing']
            },
            {
                name: 'easting',
                value: locationSearchResult['easting']
            },
            {
                name: 'location_id',
                value: locationSearchResult['id']
            }
        ]
    }

    async toAttributeValue(attributeName: string, externalValue: string) {
        if(externalValue) {
            const criteria = this.toCriteria(externalValue);
            const queryResponse = await this.findLocation(criteria);
            if(queryResponse.totalCount === 1) {
                return {
                    attributeValues: this.extractAttributeValues(queryResponse.resultList[0])
                }
            }
            else if(queryResponse.totalCount === 0) {
                return {
                    attributeValues: [{
                        name: attributeName,
                        value: externalValue,
                        error: `No Location found for location name: ${externalValue}`
                    }]
                }
            }
            else if(queryResponse.totalCount > 1) {
                return {
                    attributeValues: [{
                        name: attributeName,
                        value: externalValue,
                        error: `More than one Location found for location name: ${externalValue}`
                    }]
                }
            }
            else {
                throw new Error(`Unexpected situation total count is negative or otherwise weird: ${queryResponse.totalCount}`)
            }
        }
        else {
            return {
                attributeValues: [{
                    name: attributeName,
                    value: externalValue,
                    error: `No location name supplied`
                }]
            }
        }
    }

}