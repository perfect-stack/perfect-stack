import {ConverterResult} from "./converter.types";
import {IntegerConverter} from "./integer.converter";


export class NZTMCoordinateConverter extends IntegerConverter {
    public static readonly MIN_EASTING = 800000;
    public static readonly MAX_EASTING = 2300000;
    public static readonly MIN_NORTHING = 4400000;
    public static readonly MAX_NORTHING = 6500000;

    async toAttributeValue(attributeName: string, externalValue: string): Promise<ConverterResult> {
        if (attributeName !== 'easting' && attributeName !== 'northing') {
            return {
                attributeValues: [{
                    name: attributeName,
                    value: null,
                    error: `Attribute name '${attributeName}' is not supported by NZTMCoordinateConverter. Only 'easting' and 'northing' are allowed.`
                }]
            };
        }

        const integerResult = await super.toAttributeValue(attributeName, externalValue);
        const attributeValue = integerResult.attributeValues[0];

        if (attributeValue.error || attributeValue.value === null || attributeValue.value === undefined) {
            return integerResult;
        }

        const numericValue = attributeValue.value as number;

        if (attributeName === 'easting') {
            if (numericValue < NZTMCoordinateConverter.MIN_EASTING || numericValue > NZTMCoordinateConverter.MAX_EASTING) {
                return {
                    attributeValues: [{
                        name: attributeName,
                        value: null,
                        error: `Easting value '${externalValue}' is outside the valid NZTM range (${NZTMCoordinateConverter.MIN_EASTING} - ${NZTMCoordinateConverter.MAX_EASTING}).`
                    }]
                };
            }
        } else if (attributeName === 'northing') {
            if (numericValue < NZTMCoordinateConverter.MIN_NORTHING || numericValue > NZTMCoordinateConverter.MAX_NORTHING) {
                return {
                    attributeValues: [{
                        name: attributeName,
                        value: null,
                        error: `Northing value '${externalValue}' is outside the valid NZTM range (${NZTMCoordinateConverter.MIN_NORTHING} - ${NZTMCoordinateConverter.MAX_NORTHING}).`
                    }]
                };
            }
        }

        return integerResult;
    }
}
