import {
    ConverterResult,
    DataImportConverter,
    ExternalValue
} from "@perfect-stack/nestjs-server/data/import/converter/converter.types";

// Must be loaded even if it appears nothing is using it
import '@js-joda/timezone';
import {DateTimeFormatter, DateTimeFormatterBuilder, LocalTime} from "@js-joda/core";


export class TimeConverter implements DataImportConverter {

    outputFormat = DateTimeFormatter.ofPattern("HH:mm:ss");

    async toAttributeValue(attributeName: string, externalValue: string): Promise<ConverterResult> {
        // Needs to support the following formats;
        // HH:mm, HH:mm:ss, HH:mm:ss.SSS
        // Any error should report "Unable to convert Time" in the ConverterResult
        // Use the Joda date time library for conversion, put all of the formats into an array and loop through them in
        // the order until one works.
        const formats = ['HH:mm:ss.SSS', 'HH:mm:ss', 'HH:mm', 'k:mm:ss.SSS', 'k:mm:ss', 'k:mm'];
        for (const format of formats) {
            try {
                const localTime = LocalTime.parse(externalValue, DateTimeFormatter.ofPattern(format));
                return {
                    attributeValues: [{
                        name: attributeName,
                        value: this.outputFormat.format(localTime),
                    }]
                };
            } catch (e) {
                // Try next format
            }
        }
        return {
            attributeValues: [{
                name: attributeName,
                value: null,
                error: `Unable to convert Time [${externalValue}]`
            }]
        };
    }
}