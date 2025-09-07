import {
    AttributeValue,
    ConverterResult,
    DataImportConverter
} from "@perfect-stack/nestjs-server/data/import/converter/converter.types";
import {QueryService} from "@perfect-stack/nestjs-server";
import {Criteria, QueryRequest} from "@perfect-stack/nestjs-server/data/query.request";


export abstract class BirdIdConverter implements DataImportConverter {

    protected constructor(protected readonly queryService: QueryService) {}

    protected async findBird(criteria: Criteria) {

        const queryRequest = new QueryRequest();
        queryRequest.metaEntityName = 'Bird';
        queryRequest.criteria = [criteria];

        return await this.queryService.findByCriteria(queryRequest);
    }

    protected extractAttributeValuesFromBird(birdSearchResult: any): AttributeValue[] {

        // Needs to find: bird_id, sex, species_id, form, age_class, status
        const bird_id = birdSearchResult['id'];   // It's called bird_id in the Event and 'id' in the Bird
        const sex = birdSearchResult['sex'];
        const age_class = birdSearchResult['age_class'];
        const status = birdSearchResult['status'];

        // form for an individual Bird comes from the Bird and not the Species
        const form = birdSearchResult['form'];

        // The findByCriteria query we are using above does not load the associations, so the Bird search result
        // will only contain the species_id, which is fine for importing an Event
        const species_id = birdSearchResult['species_id'];

        return [
            {
                name: 'bird_id',
                value: bird_id
            },
            {
                name: 'sex',
                value: sex
            },
            {
                name: 'age_class',
                value: age_class
            },
            {
                name: 'status',
                value: status
            },
            {
                name: 'species_id',
                value: species_id
            },
            {
                name: 'form',
                value: form
            },
        ];
    }

    abstract toCriteria(externalValue: string): Criteria;

    async toAttributeValue(attributeName: string, externalValue: string): Promise<ConverterResult> {

        if(externalValue) {
            const criteria = this.toCriteria(externalValue);
            const queryResponse = await this.findBird(criteria);
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
                        error: `No Bird found for bird id: ${externalValue}`
                    }]
                }
            }
            else if(queryResponse.totalCount > 1) {
                return {
                    attributeValues: [{
                        name: attributeName,
                        value: externalValue,
                        error: `More than one Bird found for bird id: ${externalValue}`
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
                    error: `No bird id supplied`
                }]
            }
        }
    }
}