import { AttributeType, ComparisonOperator } from '../domain/meta.entity';
import { Criteria } from './query.request';
import {
  DateTimeFormatter,
  LocalDate,
  ZonedDateTime,
  ZoneId,
} from '@js-joda/core';

// This next import may appear to be grey and unused, but it is important because it imports the right language/words for
// when date time formats use text days and months and not just numerical values
import { Locale } from '@js-joda/locale_en';
import '@js-joda/timezone';

export const wrapWithWildcards = (value: string) => {
  if (value) {
    value = value.startsWith('%') ? value : `%${value}`;
    value = value.endsWith('%') ? value : `${value}%`;
  }
  return value;
};

export const appendWildcard = (value: string) => {
  if (value) {
    value = value.endsWith('%') ? value : `${value}%`;
  }
  return value;
};

/**
 * TODO: this probably needs more work as more queries use different kinds of data types. At the moment the app only
 * has query criteria for Text, Id and Datetime values. Once we need to support Dates (with no time) and numbers this
 * method is going to need to be smarter.
 *
 * @param value
 * @param attributeType
 */
export const convertStringToAttributeType = (
  value: string,
  attributeType: AttributeType,
): any => {
  let result: any;
  if (value) {
    switch (attributeType) {
      case AttributeType.Date:
        result = LocalDate.parse(value)
          .atStartOfDay()
          .atZone(ZoneId.of('Pacific/Auckland'));
        result = DateTimeFormatter.ISO_OFFSET_DATE_TIME.format(result);
        break;
      case AttributeType.DateTime:
        result = ZonedDateTime.parse(value).toLocalDateTime()
          .atZone(ZoneId.of('Pacific/Auckland'));
        result = DateTimeFormatter.ISO_OFFSET_DATE_TIME.format(result);
        break;
      default:
        // keep calm and use value as it is
        result = value;
    }
  }

  return result;
};

/**
 * WARNING: this method (intentionally) only does modifications for certain situations. If your query is failing
 * then it could be you have a new and novel situation not catered for below.
 */
export const getCriteriaValue = (criteria: Criteria): any => {
  let value: any = criteria.value;

  // upgrade value to the right data type, otherwise the comparison operators don't work correctly
  value = convertStringToAttributeType(value, criteria.attributeType);

  if (criteria.operator === ComparisonOperator.InsensitiveStartsWith) {
    value = appendWildcard(value);
  }

  if (criteria.operator === ComparisonOperator.InsensitiveLike) {
    value = wrapWithWildcards(value);
  }

  if (
    criteria.value &&
    criteria.attributeType === AttributeType.Date &&
    criteria.operator === ComparisonOperator.LessThanOrEqualTo
  ) {
    let dateTimeValue;
    if (criteria.value.length <= 11) {
      // we have been sent a date but need to upgrade it to a time within that date
      dateTimeValue = LocalDate.parse(criteria.value)
        .atStartOfDay()
        .atZone(ZoneId.of('Pacific/Auckland'));
    } else {
      // else the value looks long enough to be a date time so attempt to parse it
      dateTimeValue = ZonedDateTime.parse(criteria.value);
    }

    // Now we want to update the dateTimeValue of the incoming criteria to the end of the day
    const endOfDay = dateTimeValue.withHour(23).withMinute(59).withSecond(59);
    value = DateTimeFormatter.ISO_OFFSET_DATE_TIME.format(endOfDay);
  }

  if (criteria.value && criteria.attributeType === AttributeType.DateTime) {
    const dateTimeValue = ZonedDateTime.parse(criteria.value);
    value = DateTimeFormatter.ISO_OFFSET_DATE_TIME.format(dateTimeValue);
  }

  return value;
};

export const KnexComparisonOperatorMap = (): Map<ComparisonOperator,string> => {
  const map = new Map<ComparisonOperator, string>();
  map.set(ComparisonOperator.Equals, '=');
  map.set(ComparisonOperator.StartsWith, 'like');
  map.set(ComparisonOperator.InsensitiveStartsWith, 'ilike');
  map.set(ComparisonOperator.InsensitiveLike, 'ilike');
  map.set(ComparisonOperator.Includes, 'XX-TODO-XX');
  map.set(ComparisonOperator.GreaterThan, '>');
  map.set(ComparisonOperator.GreaterThanOrEqualTo, '>=');
  map.set(ComparisonOperator.LessThan, '<');
  map.set(ComparisonOperator.LessThanOrEqualTo, '<=');
  return map;
};
