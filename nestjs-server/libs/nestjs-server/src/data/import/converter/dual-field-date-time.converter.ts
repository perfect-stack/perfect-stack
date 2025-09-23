import {
    ConverterResult,
    DataListImportConverter, ExternalValue
} from "@perfect-stack/nestjs-server/data/import/converter/converter.types";
import {DateConverter} from "@perfect-stack/nestjs-server/data/import/converter/date.converter";
import {TimeConverter} from "@perfect-stack/nestjs-server/data/import/converter/time.converter";
import {DateTimeFormatter, LocalDate, LocalTime, OffsetDateTime, ZoneId} from "@js-joda/core";
import '@js-joda/timezone';



export class DualFieldDateTimeConverter implements DataListImportConverter {

    private _dateConverter = new DateConverter();
    private _timeConverter = new TimeConverter();

    private _outputFormat = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    async toAttributeValueFromExternalValueList(attributeName: string, externalValueList: ExternalValue[]): Promise<ConverterResult> {

        const dateExternalValue = externalValueList[0];
        const timeExternalValue = externalValueList[1];

        // if both values are truthy then call the respective Converters and check for errors
        // if no errors then combine into a single DateTime converter result, otherwise return the converter error
        if (dateExternalValue && timeExternalValue) {
            const dateConverterResult = await this._dateConverter.toAttributeValue(attributeName, dateExternalValue.value);
            const timeConverterResult = await this._timeConverter.toAttributeValue(attributeName, timeExternalValue.value);

            if (dateConverterResult.attributeValues[0].error || timeConverterResult.attributeValues[0].error) {
                return {
                    attributeValues: [{
                        name: attributeName,
                        value: null,
                        error: 'Unable to convert DateTime'
                }]};
            }
            else {
                // merge the time value into the date value and then return that
                const dateStr = dateConverterResult.attributeValues[0].value as string;
                const timeStr = timeConverterResult.attributeValues[0].value as string;

                // Convert the UTC dateStr into a New Zealand LocalDate
                const utcDateTime = OffsetDateTime.parse(dateStr);
                const nzZoneId = ZoneId.of('Pacific/Auckland');

                const dateValue: LocalDate = utcDateTime.atZoneSameInstant(nzZoneId).toLocalDate();

                const timeValue = LocalTime.parse(timeStr);
                const nzDateTime = dateValue.atTime(timeValue).atZone(nzZoneId);
                const dateTimeValue = nzDateTime.withZoneSameInstant(ZoneId.UTC);

                return {
                    attributeValues: [{
                        name: attributeName,
                        value: this._outputFormat.format(dateTimeValue)
                    }]
                }
            }
        }

        return {
            attributeValues: [{
                name: attributeName,
                value: null,
                error: 'Unable to convert DateTime'
            }]
        };
    }
}