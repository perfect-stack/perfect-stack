import {DateTimeFormatter, LocalDate, LocalTime, ResolverStyle, ZoneId} from "@js-joda/core";
import {Locale} from "@js-joda/locale_en";
import {ConverterResult, DataImportConverter} from "./converter.types";

// Must be loaded even if it appears nothing is using it
import '@js-joda/timezone';


export class DateConverter extends DataImportConverter {
    // Needs to support the following formats;
    // d/M/yy, d/M/yyyy, dd/MM/yy, d/MM/yyyy, d-MMM-yy, d-MMM-yyyy, d-MM-yyyy, yyyy-MM-dd
    // Any error should report "Unable to convert Date" in the ConverterResult

    // A list of supported formatters, ordered from most to least likely if needed.
    private static readonly SUPPORTED_FORMATS = [
        'd/M/yy',
        'd/M/yyyy',
        'dd/MM/yy',
        'd/MM/yyyy',
        'd-MMM-yy',
        'd-MMM-yyyy',
        'd-MM-yyyy',
        'dd-MM-yy',
        'yyyy-MM-dd'
    ].map(pattern => DateTimeFormatter
        .ofPattern(pattern).withLocale(Locale.ENGLISH).withResolverStyle(ResolverStyle.SMART));

    async toAttributeValue(attributeName: string, externalValue: string): Promise<ConverterResult> {
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

                // Success! Return the standardized ISO format with time (YYYY-MM-DDTHH:mm:ssZ)
                console.log('SUCCESS: ' + parsedDate.toString());

                // At the moment the imported data does not have a time component, but the application entity validation
                // expects the date to be a date_time. For now, until there are further requirements we can just assume
                // it s a "day" value and add the time component.

                try {
                    const zonedDateTime = parsedDate.atTime(LocalTime.of(12, 0, 0)).atZone(ZoneId.of('Pacific/Auckland'));
                    const value = zonedDateTime.toInstant().toString();

                    return {
                        attributeValues: [{
                            name: attributeName,
                            value: value
                        }]
                    };
                }
                catch (e2) {
                    // This is a little tricky, the converter works mostly on the basis that if it catches a parsing
                    // error it should go onto the next format, but what we really want is that once it has found a
                    // date then any further thrown Errors still need to be bubbled up past the "catch(e){}" catch-all
                    // below. So it "parsedDate.atTime()" above has a problem, then lets return a more obvious error
                    // to indicate that something has gone bad with the "inner" catch block.
                    return {
                        attributeValues: [{
                            name: attributeName,
                            value: externalValue, // Return the original value for context
                            error: 'Unexpected Timezone Error: Will need developer intervention'
                        }]
                    };
                }

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
