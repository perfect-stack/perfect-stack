import { Injectable } from '@angular/core';
import {
  ChronoField,
  DateTimeFormatter,
  Instant,
  LocalDate,
  LocalDateTime,
  LocalTime,
  TemporalAccessor,
  ZonedDateTime,
  ZoneId
} from '@js-joda/core';

@Injectable({
  providedIn: 'root'
})
export class TimeService {

  constructor() { }


  parseDateTimeFormValue(value: string): DateTimeComponents {
    // The formValue may be any one of (Date+Time, Date, Time, Empty). To create the new value we only need to extract
    // the time portion (if it exists) since we are about to set our own date value. These are database values so
    // are expected to be standard UTC values.

    let dateTime, date, time;
    let empty = false, invalid = true;

    if(value) {
      try {
        dateTime = Instant.parse(value);
        invalid = false;
      }
      catch (e) {}

      try {
        const datePortion = value.substring(0, 'yyyy-MM-dd'.length);
        date = DateTimeFormatter.ofPattern('yyyy-MM-dd').parse(datePortion);
        invalid = false;
      }
      catch (e) {}

      try {
        const timePortion = value.length <= 'HH:mm:ss'.length ? value.substring(0, 'HH:mm:ss'.length) : value.substring('yyyy-MM-ddT'.length, 'yyyy-MM-ddTHH:mm:ss'.length);
        time = DateTimeFormatter.ofPattern('HH:mm:ss').parse(timePortion);
        invalid = false;
      }
      catch (e) {}
    }
    else {
      empty = true;
      invalid = false;
    }

    if(invalid) {
      throw new Error(`Unable to parse DateTime value of ${value}`);
    }

    return {dateTime, date, time, empty};
  }

  /**
   * Merge the supplied date value into the formValue, which may or may not already have a Date and/or a Time.
   * @param formValue - any one of the following ("", "date", "date+time", "time")
   * @param date
   */
  mergeDate(formValue: string, date: LocalDate) {
    const dateTimeComponents = this.parseDateTimeFormValue(formValue);

    // the new value is the date selected from the input plus any time value from the existing value if there is any time
    // and converted into a UTC value. If there is Time then we can have UTC otherwise it has to be a LocalDate.
    let newFormValue;
    if(dateTimeComponents.dateTime) {
      const zonedDateTime = ZonedDateTime.ofInstant(dateTimeComponents.dateTime, ZoneId.of('Pacific/Auckland')).withYear(date.year()).withMonth(date.monthValue()).withDayOfMonth(date.dayOfMonth());
      newFormValue= zonedDateTime.toInstant().toString();
    }
    else if(dateTimeComponents.time) {
      const time = dateTimeComponents.time;
      const localDateTime = LocalDateTime.of(date.year(), date.month(), date.dayOfMonth(), time.get(ChronoField.HOUR_OF_DAY), time.get(ChronoField.MINUTE_OF_HOUR), time.get(ChronoField.SECOND_OF_MINUTE));
      const zonedDateTime = ZonedDateTime.of(localDateTime, ZoneId.of('Pacific/Auckland'));
      newFormValue = zonedDateTime.toInstant().toString();
    }
    else {
      // If dateComponents.date, or empty the both are the same, and we just create a LocalDate
      const dateFormat = DateTimeFormatter.ofPattern('yyyy-MM-dd'); // This is always this format because it's a database value
      newFormValue = dateFormat.format(date);
    }

    return newFormValue;
  }

  /**
   * Merge the supplied time value into the formValue, which may or may not already have a Date and/or a Time.
   * @param formValue - any one of the following ("", "date", "date+time", "time")
   * @param time
   */
  mergeTime(formValue: string, time: LocalTime) {
    const dateTimeComponents = this.parseDateTimeFormValue(formValue);

    // the new value is the time selected from the input plus any date value from the existing value if there is any date
    // and converted into a UTC value. If there is a Date value then we can have UTC otherwise it has to be a LocalTime.
    let newFormValue;
    if(dateTimeComponents.dateTime) {
      const zonedDateTime = ZonedDateTime.ofInstant(dateTimeComponents.dateTime, ZoneId.of('Pacific/Auckland')).withHour(time.hour()).withMinute(time.minute()).withSecond(time.second());
      newFormValue= zonedDateTime.toInstant().toString();
    }
    else if(dateTimeComponents.date) {
      const date = dateTimeComponents.date;
      const localDateTime = LocalDateTime.of(date.get(ChronoField.YEAR), date.get(ChronoField.MONTH_OF_YEAR), date.get(ChronoField.DAY_OF_MONTH), time.hour(), time.minute(), time.second());
      const zonedDateTime = ZonedDateTime.of(localDateTime, ZoneId.of('Pacific/Auckland'));
      newFormValue = zonedDateTime.toInstant().toString();
    }
    else {
      // If dateComponents.time, or empty they both are the same, and we just create a LocalTime
      const dateFormat = DateTimeFormatter.ofPattern('HH:mm:ss'); // This is always this format because it's a database value
      newFormValue = dateFormat.format(time);
    }

    return newFormValue;
  }

}

export class DateTimeComponents {
  dateTime: Instant | undefined;
  date: TemporalAccessor | undefined;
  time: TemporalAccessor | undefined;
  empty: boolean;
}
