import {ConverterResult, DataImportConverter} from "./converter.types";


export class IntegerConverter extends DataImportConverter {
    private static readonly INTEGER_REGEX = /^[+-]?(?:\d+|\d{1,3}(?:,\d{3})+)$/;

    async toAttributeValue(attributeName: string, externalValue: string): Promise<ConverterResult> {
        // Check that if not null then externalValue must be a valid number, otherwise return an error
        if (externalValue === null || externalValue === undefined || externalValue === '') {
            return {
                attributeValues: [{
                    name: attributeName,
                    value: null
                }]
            };
        }

        const trimmed = typeof externalValue === 'string' ? externalValue.trim() : String(externalValue).trim();

        if (!IntegerConverter.INTEGER_REGEX.test(trimmed)) {
            return {
                attributeValues: [{
                    name: attributeName,
                    value: null,
                    error: `Value '${externalValue}' is not a valid integer.`
                }]
            };
        }

        const parsedValue = parseInt(trimmed.replace(/,/g, ''), 10);

        if (isNaN(parsedValue)) {
            return {
                attributeValues: [{
                    name: attributeName,
                    value: null,
                    error: `Value '${externalValue}' is not a valid integer.`
                }]
            };
        }

        return {
            attributeValues: [{
                name: attributeName,
                value: parsedValue,
            }]
        };
    }
}
