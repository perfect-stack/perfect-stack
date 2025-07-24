import {ConverterResult, DataImportConverter} from "./converter.types";


export class IntegerConverter extends DataImportConverter {
    toAttributeValue(attributeName: string, externalValue: string): ConverterResult {
        // Check that if not null then externalValue must be a valid number, otherwise return an error
        if (externalValue === null || externalValue === undefined || externalValue === '') {
            return {
                col: 0,
                attributeValues: [{
                    name: attributeName,
                    value: null
                }]
            };
        }

        const parsedValue = parseInt(externalValue, 10);

        if (isNaN(parsedValue)) {
            return {
                col: 0,
                attributeValues: [{
                    name: attributeName,
                    value: null,
                    error: `Value '${externalValue}' is not a valid integer.`
                }]
            };
        }

        return {
            col: 0,
            attributeValues: [{
                name: attributeName,
                value: String(parsedValue),
            }]
        };
    }
}
