import {
  RangeRuleConfig,
  ResultType,
  RuleValidator,
  ValidationResult,
} from '../../../domain/meta.rule';
import { AttributeType, MetaAttribute } from '../../../domain/meta.entity';

export class RangeRuleValidator extends RuleValidator {
  async validate(
    entity: any,
    attribute: MetaAttribute,
  ): Promise<ValidationResult | null> {
    if (this.ruleData.config) {
      const rangeRuleConfig = this.toRangeRuleConfig(this.ruleData.config);
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

  toRangeRuleConfig(config: string): RangeRuleConfig {
    const values = config.split(',');
    let minValue = null;
    let maxValue = null;
    if (values) {
      if (values.length > 0) {
        minValue = values[0];
      }
      if (values.length > 1) {
        maxValue = values[1];
      }
    }
    return {
      minValue: minValue,
      maxValue: maxValue,
    };
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
    if (rangeRuleConfig.minValue !== null) {
      const minValue = Number(rangeRuleConfig.minValue);
      if (value < minValue) {
        return {
          name: attribute.name,
          resultType: ResultType.Error,
          message: `Attribute value must be a min value of ${minValue} or greater`,
        };
      }
    }

    if (rangeRuleConfig.maxValue !== null) {
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
