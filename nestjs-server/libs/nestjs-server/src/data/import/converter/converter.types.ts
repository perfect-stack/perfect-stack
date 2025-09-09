
export class ExternalValue {
    name: string;
    value: string;
    col: number;
}

export class AttributeValue {
    name: string;
    value: string | number | [] | null;
    error?: string;
}

export class ConverterResult {
    attributeValues: AttributeValue[] = [];
}

export class DataImportConverter {
    // string, date, number, codetable, band_number
    async toAttributeValue(attributeName: string, externalValue: string): Promise<ConverterResult> {
        // might need to return more than one value e.g. band_number needs a lookup to get bird_id
        return;
    }
}

export class DataListImportConverter {
    async toAttributeValueFromExternalValueList(attributeName: string, externalValueList: ExternalValue[]): Promise<ConverterResult> {
        return;
    }
}