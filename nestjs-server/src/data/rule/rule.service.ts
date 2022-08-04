import { Injectable, Logger } from '@nestjs/common';
import { MetaAttribute, MetaEntity } from '../../domain/meta.entity';
import {
  MetaEntityRuleValidator,
  RuleData,
  RuleType,
  RuleValidator,
  ValidationResultMap,
} from '../../domain/meta.rule';
import { RangeRuleValidator } from './rules/range-rule-validator';
import { RequiredRuleValidator } from './rules/required-rule-validator';
import { UniqueRuleValidator } from './rules/unique-rule-validator';
import { KnexService } from '../../knex/knex.service';

@Injectable()
export class RuleService implements MetaEntityRuleValidator {
  private readonly logger = new Logger(RuleService.name);

  constructor(protected readonly knexService: KnexService) {}

  async validate(
    entity: any,
    metaEntity: MetaEntity,
  ): Promise<ValidationResultMap> {
    const validationResultMap = {};

    for (const attribute of metaEntity.attributes) {
      const rules = attribute.rules;
      if (rules && rules.length > 0) {
        for (const ruleData of rules) {
          const rule = this.createValidatorRule(
            ruleData,
            metaEntity,
            attribute,
          );

          const validationResult = await rule.validate(entity, attribute);

          if (validationResult) {
            validationResultMap[validationResult.name] = validationResult;
          }
        }
      }
    }

    return validationResultMap;
  }

  private createValidatorRule(
    ruleData: RuleData,
    metaEntity: MetaEntity,
    attribute: MetaAttribute,
  ): RuleValidator | null {
    switch (ruleData.type) {
      case RuleType.Required:
        return new RequiredRuleValidator(metaEntity, attribute, ruleData);
      case RuleType.Range:
        return new RangeRuleValidator(metaEntity, attribute, ruleData);
      case RuleType.Unique:
        return new UniqueRuleValidator(
          this.knexService,
          metaEntity,
          attribute,
          ruleData,
        );
      default:
        throw new Error(
          `Unknown rule type of ${ruleData.type}. Unable to fine RuleValidator`,
        );
    }
  }
}
