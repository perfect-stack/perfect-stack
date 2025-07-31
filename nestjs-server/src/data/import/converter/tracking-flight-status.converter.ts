import {ConverterResult, DataImportConverter} from "./converter.types";


/**
 * This converter has overlap and repeats some of what BandNumberLookupConverter does, but wanted to keep them separate
 * so that did not muddle their responsibilities and so that BandNumberLookupConverter can still be used for other
 * import formats in the future.
 */
export class TrackingFlightStatusConverter implements DataImportConverter {

    readonly statusMap = new Map<string, string>();

    constructor() {
        this.statusMap.set('Alive', 'Alive');
        this.statusMap.set('Mortality', 'Dead');
    }

    async toAttributeValue(attributeName: string, externalValue: string): Promise<ConverterResult> {
        const internalValue = this.statusMap.get(externalValue);
        if(internalValue) {
            return {
                attributeValues: [
                    {
                        name: attributeName,
                        value: internalValue
                    }
                ]
            }
        }
        else {
            return {
                attributeValues: [
                    {
                        name: attributeName,
                        value: externalValue, // Return the original value for context
                        error: 'Unknown status value of ' + externalValue
                    }
                ]
            }
        }
    }
}