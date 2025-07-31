import {ConverterResult, DataImportConverter} from "./converter.types";


export class TextConverter implements DataImportConverter {

    async toAttributeValue(attributeName: string, externalValue: string): Promise<ConverterResult> {
        return {
            attributeValues: [{
                name: attributeName,
                value: externalValue,
            }]
        };
    }
}