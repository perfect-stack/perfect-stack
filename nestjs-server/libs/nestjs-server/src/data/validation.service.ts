import {Injectable} from "@nestjs/common";
import {ValidationResultMapController} from "../domain/meta.rule";
import { EventService } from '../event/event.service';
import {RuleService} from "./rule/rule.service";
import {MetaEntity} from "../domain/meta.entity";


@Injectable()
export class ValidationService {

    constructor(protected readonly eventService: EventService,
                protected readonly ruleService: RuleService) {}


    async validate(metaEntityMap: Map<string, MetaEntity>, metaEntity: MetaEntity, entity: any) {

        const eventValidations = await this.eventService.dispatchOnBeforeSave(
            entity,
            metaEntity,
            metaEntityMap,
        );

        const ruleValidations = await this.ruleService.validate(
            entity,
            metaEntity,
            metaEntityMap,
        );

        const validationResultMapController = new ValidationResultMapController({
            ...eventValidations,
            ...ruleValidations,
        });

        return validationResultMapController;
    }
}