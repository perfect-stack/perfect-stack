import {
    ConverterResult,
    DataImportConverter,
    DataListImportConverter, ExternalValue
} from "@perfect-stack/nestjs-server/data/import/converter/converter.types";



export class DualFieldDateTimeConverter implements DataListImportConverter {

    async toAttributeValueFromExternalValueList(externalValueList: ExternalValue[]): Promise<ConverterResult> {
        return {
            attributeValues: [{
                name: null,
                value: null
            }]
        };
    }
}