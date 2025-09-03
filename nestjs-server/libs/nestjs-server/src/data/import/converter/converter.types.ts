export class AttributeValue {
    name: string;
    value: string | number | [] | null;
    error?: string;
}

export class ConverterResult {
    col?: number = 0;
    attributeValues: AttributeValue[] = [];
}

export class DataImportConverter {
    // string, date, number, codetable, band_number
    async toAttributeValue(attributeName: string, externalValue: string): Promise<ConverterResult> {
        // might need to return more than one value e.g. band_number needs a lookup to get bird_id
        return;
    }
}