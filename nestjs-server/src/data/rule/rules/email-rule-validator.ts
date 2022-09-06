import {
  ResultType,
  RuleValidator,
  ValidationResult,
} from '../../../domain/meta.rule';
import { MetaAttribute } from '../../../domain/meta.entity';

export class EmailRuleValidator extends RuleValidator {
  async validate(
    entity: any,
    attribute: MetaAttribute,
  ): Promise<ValidationResult | null> {
    const value = String(entity[attribute.name]);

    let valid = false;
    if (value) {
      // valid if value matches this "simple" regex (someone@something.something)
      valid = /^\S+@\S+\.\S+$/.test(value);
    }

    if (!valid) {
      return {
        name: attribute.name,
        resultType: ResultType.Error,
        message: 'Email address is invalid',
      };
    } else {
      return null;
    }
  }
}
