import {
  DateRuleName,
  RangeRuleConfig,
  ResultType,
  RuleValidator,
  ValidationResult,
} from '../../../domain/meta.rule';
import { AttributeType, MetaAttribute } from '../../../domain/meta.entity';
import { Logger } from '@nestjs/common';
import { LocalDate, ZonedDateTime, ZoneId } from '@js-joda/core';

export class RangeRuleValidator extends RuleValidator {
  private logger = new Logger(RangeRuleValidator.name);

  async validate(
    entity: any,
    attribute: MetaAttribute,
  ): Promise<ValidationResult | null> {
    if (this.ruleData.config) {
      const rangeRuleConfig = this.toRangeRuleConfig(this.ruleData.config);
      const value = entity[attribute.name];

      if (this.metaAttribute.type === AttributeType.Date) {
        return this.validateDateValue(
          value,
          rangeRuleConfig,
          entity,
          attribute,
        );
      } else if (this.metaAttribute.type === AttributeType.DateTime) {
        return this.validateDateTimeValue(
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
    this.logger.log(
      `Validate Date of value "${value}" for range of "${JSON.stringify(
        rangeRuleConfig,
      )}"`,
    );

    let minDateValue = null;
    if (rangeRuleConfig.minValue) {
      if (rangeRuleConfig.minValue === '$today') {
        minDateValue = LocalDate.now();
      }
    }

    let maxDateValue = null;
    if (rangeRuleConfig.maxValue) {
      if (rangeRuleConfig.maxValue === '$today') {
        maxDateValue = LocalDate.now();
      }
    }

    if (value) {
      const dateValue = LocalDate.parse(value);
      if (minDateValue && dateValue.isBefore(minDateValue)) {
        return {
          name: attribute.name,
          resultType: ResultType.Error,
          message: `Attribute must have a min value of "${this.toDateRangeName(
            rangeRuleConfig.minValue as DateRuleName,
          )}" or greater`,
        };
      }

      if (maxDateValue && dateValue.isAfter(maxDateValue)) {
        return {
          name: attribute.name,
          resultType: ResultType.Error,
          message: `Attribute must have a max value of "${this.toDateRangeName(
            rangeRuleConfig.maxValue as DateRuleName,
          )}" or less`,
        };
      }
    }

    return null;
  }

  async validateDateTimeValue(
    value: string,
    rangeRuleConfig: RangeRuleConfig,
    entity: any,
    attribute: MetaAttribute,
  ): Promise<ValidationResult | null> {
    this.logger.log(
      `Validate Datetime of value "${value}" for range of "${JSON.stringify(
        rangeRuleConfig,
      )}"`,
    );

    let minDateTimeValue = null;
    if (rangeRuleConfig.minValue) {
      if (rangeRuleConfig.minValue === '$today') {
        minDateTimeValue = ZonedDateTime.now(ZoneId.of('Pacific/Auckland'))
          .withHour(0)
          .withMinute(0)
          .withSecond(0)
          .withNano(0);
      }
    }

    let maxDateTimeValue = null;
    if (rangeRuleConfig.maxValue) {
      if (rangeRuleConfig.maxValue === '$today') {
        maxDateTimeValue = ZonedDateTime.now(ZoneId.of('Pacific/Auckland'))
          .withHour(23)
          .withMinute(59)
          .withSecond(59)
          .withNano(0);
      }
    }

    if (value && value.length > 10) {
      const dateTimeValue = ZonedDateTime.parse(value);
      if (minDateTimeValue && dateTimeValue.isBefore(minDateTimeValue)) {
        return {
          name: attribute.name,
          resultType: ResultType.Error,
          message: `Attribute must have a min value of "${this.toDateRangeName(
            rangeRuleConfig.minValue as DateRuleName,
          )}" or greater`,
        };
      }

      if (maxDateTimeValue && dateTimeValue.isAfter(maxDateTimeValue)) {
        return {
          name: attribute.name,
          resultType: ResultType.Error,
          message: `Attribute must have a max value of "${this.toDateRangeName(
            rangeRuleConfig.maxValue as DateRuleName,
          )}" or less`,
        };
      }
    }

    return null;
  }

  private toDateRangeName(rangeName: DateRuleName | null) {
    return rangeName ? rangeName.substring(1) : '';
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
          message: `Attribute must have a min value of ${minValue} or greater`,
        };
      }
    }

    if (rangeRuleConfig.maxValue !== null) {
      const maxValue = Number(rangeRuleConfig.maxValue);
      if (value > maxValue) {
        return {
          name: attribute.name,
          resultType: ResultType.Error,
          message: `Attribute must have a max value of ${maxValue} or less`,
        };
      }
    }

    return null;
  }
}
