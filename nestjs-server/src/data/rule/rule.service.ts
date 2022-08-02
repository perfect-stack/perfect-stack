import { Injectable, Logger } from '@nestjs/common';
import {
  AttributeType,
  MetaAttribute,
  MetaEntity,
} from '../../domain/meta.entity';
import {
  MetaEntityRuleValidator,
  RangeRuleConfig,
  ResultType,
  RuleData,
  RuleType,
  RuleValidator,
  ValidationResult,
  ValidationResultMap,
} from '../../domain/meta.rule';

@Injectable()
export class RuleService implements MetaEntityRuleValidator {
  private readonly logger = new Logger(RuleService.name);

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
      default:
        throw new Error(
          `Unknown rule type of ${ruleData.type}. Unable to fine RuleValidator`,
        );
    }
  }
}

export class RequiredRuleValidator extends RuleValidator {
  async validate(
    entity: any,
    attribute: MetaAttribute,
  ): Promise<ValidationResult | null> {
    const value = entity[attribute.name];
    let valid = undefined;
    if (attribute.type === AttributeType.Boolean) {
      // valid if value = true or false (invalid if null or undefined)
      valid = value || value === false;
    } else {
      valid = value !== null && value !== undefined && String(value).length > 0;
    }

    if (!valid) {
      return {
        name: attribute.name,
        resultType: ResultType.Error,
        message: 'Attribute is required',
      };
    } else {
      return null;
    }
  }
}

export class RangeRuleValidator extends RuleValidator {
  async validate(
    entity: any,
    attribute: MetaAttribute,
  ): Promise<ValidationResult | null> {
    const rangeRuleConfig = this.ruleData.config;
    if (rangeRuleConfig) {
      const value = entity[attribute.name];

      if (
        this.metaAttribute.type === AttributeType.Date ||
        this.metaAttribute.type === AttributeType.DateTime
      ) {
        return this.validateDateValue(
          value,
          rangeRuleConfig,
          entity,
          attribute,
        );
      } else {
        return this.validateNumberValue(
          value,
          rangeRuleConfig,
          entity,
          attribute,
        );
      }
    } else {
      throw new Error(
        `Invalid RuleData. RangeRule has no RangeRuleConfig supplied within it`,
      );
    }
  }

  async validateDateValue(
    value: string,
    rangeRuleConfig: RangeRuleConfig,
    entity: any,
    attribute: MetaAttribute,
  ): Promise<ValidationResult | null> {
    return null;
  }

  async validateNumberValue(
    value: number,
    rangeRuleConfig: RangeRuleConfig,
    entity: any,
    attribute: MetaAttribute,
  ): Promise<ValidationResult | null> {
    if (rangeRuleConfig.minValue) {
      const minValue = Number(rangeRuleConfig.minValue);
      if (value < minValue) {
        return {
          name: attribute.name,
          resultType: ResultType.Error,
          message: `Attribute value must be a min value of ${minValue} or greater`,
        };
      }
    }

    if (rangeRuleConfig.maxValue) {
      const maxValue = Number(rangeRuleConfig.maxValue);
      if (value > maxValue) {
        return {
          name: attribute.name,
          resultType: ResultType.Error,
          message: `Attribute value must be a max value of ${maxValue} or less`,
        };
      }
    }

    return null;
  }
}
