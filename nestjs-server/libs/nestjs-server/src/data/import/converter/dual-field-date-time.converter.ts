import {
    ConverterResult,
    DataListImportConverter, ExternalValue
} from "@perfect-stack/nestjs-server/data/import/converter/converter.types";
import {DateConverter} from "@perfect-stack/nestjs-server/data/import/converter/date.converter";
import {TimeConverter} from "@perfect-stack/nestjs-server/data/import/converter/time.converter";
import {LocalTime, ZonedDateTime} from "@js-joda/core";



export class DualFieldDateTimeConverter implements DataListImportConverter {

    private _dateConverter = new DateConverter();
    private _timeConverter = new TimeConverter();

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

                const dateValue = ZonedDateTime.parse(dateStr);
                const timeValue = LocalTime.parse(timeStr);

                const dateTimeValue = dateValue.with(timeValue);

                return {
                    attributeValues: [{
                        name: attributeName,
                        value: dateTimeValue.toString()
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