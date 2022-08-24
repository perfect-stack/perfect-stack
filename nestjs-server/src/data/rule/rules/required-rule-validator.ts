import {
  ResultType,
  RuleValidator,
  ValidationResult,
} from '../../../domain/meta.rule';
import { AttributeType, MetaAttribute } from '../../../domain/meta.entity';
import { Instant } from '@js-joda/core';

export class RequiredRuleValidator extends RuleValidator {
  async validate(
    entity: any,
    attribute: MetaAttribute,
  ): Promise<ValidationResult | null> {
    const name =
      attribute.type === AttributeType.ManyToOne
        ? attribute.name + '_id'
        : attribute.name;
    const value = entity[name];

    let valid = undefined;
    if (attribute.type === AttributeType.Boolean) {
      // valid if value = true or false (invalid if null or undefined)
      valid = value || value === false;
    } else if (attribute.type === AttributeType.DateTime) {
      valid = this.isValidDateTime(value);
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

  private isValidDateTime(value: any) {
    if (value) {
      try {
        Instant.parse(value);
        return true;
      } catch (e) {}
    }
    return false;
  }
}
