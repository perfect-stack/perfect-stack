import {ConverterResult, DataImportConverter} from "@perfect-stack/nestjs-server/data/import/converter/converter.types";



export class DualFieldDateTimeConverter implements DataImportConverter {

    async toAttributeValue(attributeName: string, externalValue: string): Promise<ConverterResult> {

        return {
            attributeValues: [{
                name: attributeName,
                value: null
            }]
        };
    }
}