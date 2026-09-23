import { ConverterResult, DataImportConverter } from './converter.types';

export class DoubleConverter extends DataImportConverter {
  private static readonly DOUBLE_REGEX =
    /^[+-]?(?:(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?|(?:\.\d+))(?:[eE][+-]?\d+)?$/;

  async toAttributeValue(
    attributeName: string,
    externalValue: string,
  ): Promise<ConverterResult> {
    if (
      externalValue === null ||
      externalValue === undefined ||
      externalValue === ''
    ) {
      return {
        attributeValues: [
          {
            name: attributeName,
            value: null,
          },
        ],
      };
    }

    const trimmed =
      typeof externalValue === 'string'
        ? externalValue.trim()
        : String(externalValue).trim();

    if (!DoubleConverter.DOUBLE_REGEX.test(trimmed)) {
      return {
        attributeValues: [
          {
            name: attributeName,
            value: null,
            error: `Value '${externalValue}' is not a valid number.`,
          },
        ],
      };
    }

    const parsedValue = parseFloat(trimmed.replace(/,/g, ''));

    if (isNaN(parsedValue)) {
      return {
        attributeValues: [
          {
            name: attributeName,
            value: null,
            error: `Value '${externalValue}' is not a valid number.`,
          },
        ],
      };
    }

    return {
      attributeValues: [
        {
          name: attributeName,
          value: parsedValue,
        },
      ],
    };
  }
}
