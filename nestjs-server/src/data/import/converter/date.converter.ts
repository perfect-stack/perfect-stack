import {ConverterResult, DataAttributeMapping, DataImportConverter} from "../data-import.types";
import {DateTimeFormatter, LocalDate, ResolverStyle} from "@js-joda/core";

import '@js-joda/locale_en';
import {Locale} from "@js-joda/locale_en";

export class DateConverter extends DataImportConverter {
    // Needs to support the following formats;
    // d/M/yy, d/M/yyyy, dd/MM/yy, d/MM/yyyy, d-MMM-yy, d-MMM-yyyy, dd-MM-yy, d-MM-yyyy, yyyy-MM-dd
    // Any error should report "Unable to convert Date" in the ConverterResult
    // Use JS-Joda and NOT Moment

    // A list of supported formatters, ordered from most to least likely if needed.
    private static readonly SUPPORTED_FORMATS = [
        'd/M/yy',
        'd/M/yyyy',
        'dd/MM/yy',
        'd/MM/yyyy',
        'd-MMM-yy',
        'd-MMM-yyyy',
        'yyyy-MM-dd'
    ].map(pattern => DateTimeFormatter
        .ofPattern(pattern).withLocale(Locale.ENGLISH).withResolverStyle(ResolverStyle.SMART));

    toAttributeValue(attributeName: string, externalValue: string): ConverterResult {
        if (!externalValue) {
            return {
                attributeValues: [{
                    name: attributeName,
                    value: null,
                }]
            };
        }

        for (const formatter of DateConverter.SUPPORTED_FORMATS) {
            try {
                // Attempt to parse the date with the current formatter
                const parsedDate = LocalDate.parse(externalValue, formatter);

                // Success! Return the standardized ISO format (YYYY-MM-DD)
                return {
                    attributeValues: [{
                        name: attributeName,
                        value: parsedDate.toString()
                    }]
                };
            } catch (e) {
                // This was not the correct format, continue to the next one.
            }
        }

        // If no formatters worked, return an error.
        return {
            attributeValues: [{
                name: attributeName,
                value: externalValue, // Return the original value for context
                error: 'Unable to convert Date'
            }]
        };
    }
}
