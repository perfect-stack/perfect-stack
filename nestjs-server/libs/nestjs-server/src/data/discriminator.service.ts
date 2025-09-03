import {Injectable} from "@nestjs/common";
import {MetaAttribute} from "../domain/meta.entity";
import {QueryService} from "./query.service";

export interface DiscriminatorMapping {
    discriminatorId: string;
    discriminatorValue: string;
    metaEntityName: string;
    metaPageName: string;
}

@Injectable()
export class DiscriminatorService {

    constructor(protected readonly queryService: QueryService) {
    }

    async findDiscriminatorMap(attribute: MetaAttribute): Promise<Map<string, DiscriminatorMapping>> {
        const discriminatorMap = new Map<string, DiscriminatorMapping>();

        const response = await this.queryService.findAll(attribute.discriminator.discriminatorType);
        console.log('findDiscriminatorMap response = ' + JSON.stringify(response));

        for(const nextEntityMapping of attribute.discriminator.entityMappingList) {
            const entityList = response.resultList.filter(s => s['name'] === nextEntityMapping.discriminatorValue);
            if(entityList.length === 1) {
                const entity = entityList[0];
                const discriminatorMapping = {
                    discriminatorId: entity.id,
                    discriminatorValue: nextEntityMapping.discriminatorValue,
                    metaEntityName: nextEntityMapping.metaEntityName,
                    metaPageName: nextEntityMapping.metaEntityName + '.view_edit'
                }

                console.log('adding mapping for ' + entity.id + ' => ' + nextEntityMapping.discriminatorValue);
                discriminatorMap.set(entity.id, discriminatorMapping);
                discriminatorMap.set(nextEntityMapping.discriminatorValue, discriminatorMapping);
            }
        }

        return discriminatorMap;
    }
}