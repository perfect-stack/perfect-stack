import {AttributeValue, ConverterResult, DataImportConverter} from "./converter.types";
import {QueryService} from "../../query.service";
import {AttributeType, ComparisonOperator} from "../../../domain/meta.entity";
import {Criteria, QueryRequest} from "../../query.request";


export class BandNumberLookupConverter implements DataImportConverter {


    constructor(protected readonly queryService: QueryService) {
    }

    async findBirdFromBandNumber(bandNumber: string) {

        const criteria: Criteria = {
            attributeType: AttributeType.Text,
            operator: ComparisonOperator.InsensitiveStartsWith,
            name: 'band_number',
            value: bandNumber
        };

        const queryRequest = new QueryRequest();
        queryRequest.metaEntityName = 'Bird';
        queryRequest.criteria = [criteria];

        return await this.queryService.findByCriteria(queryRequest);
    }

    async toAttributeValue(attributeName: string, externalValue: string): Promise<ConverterResult> {

        if(externalValue) {
            const queryResponse = await this.findBirdFromBandNumber(externalValue);
            if(queryResponse.totalCount === 1) {
                return {
                    attributeValues: this.extractAttributeValuesFromBird(queryResponse.resultList[0])
                }
            }
            else if(queryResponse.totalCount === 0) {
                return {
                    attributeValues: [{
                        name: attributeName,
                        value: externalValue,
                        error: `No Bird found for band number ${externalValue}`
                    }]
                }
            }
            else if(queryResponse.totalCount > 1) {
                return {
                    attributeValues: [{
                        name: attributeName,
                        value: externalValue,
                        error: `More than one Bird found for band number ${externalValue}`
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
                    error: `No band number supplied`
                }]
            }
        }
    }

    private extractAttributeValuesFromBird(birdSearchResult: any): AttributeValue[] {

        // // Needs to find: bird_id, sex, species_id, form, age_class, status
        // const birdAttributes = ['bird_id', 'sex', 'species_id', 'form', 'age_class', 'status'];
        //
        // const attributeValues: AttributeValue[] = [];
        // for(const nextAttribute of birdAttributes) {
        //     attributeValues.push({
        //         name: nextAttribute,
        //         value: birdSearchResult[nextAttribute]
        //     })
        // }
        //
        // return attributeValues;

        return [{
            name: 'bird_id',
            value: birdSearchResult['id']  // It's called bird_id in the Event and 'id' in the Bird
        }]
    }
}
