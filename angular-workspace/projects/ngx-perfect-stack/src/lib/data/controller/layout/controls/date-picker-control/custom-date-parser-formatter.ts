import {NgbDateParserFormatter, NgbDateStruct} from '@ng-bootstrap/ng-bootstrap';
import {Inject, Injectable} from '@angular/core';
import {DateTimeFormatter, LocalDate, LocalDateTime} from '@js-joda/core';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../../../../../ngx-perfect-stack-config';

// This next import may appear to be grey and unused, but it is important because it imports the right language/words for
// when date time formats use text days and months and not just numerical values
import { Locale } from '@js-joda/locale_en' // Get `Locale` from the prebuilt package of your choice

/**
 * This Service handles how the date is rendered and parsed from keyboard i.e. in the bound input field.
 */
@Injectable()
export class CustomDateParserFormatter extends NgbDateParserFormatter {

  dateFormatter: DateTimeFormatter;

  constructor(
    @Inject(STACK_CONFIG)
    protected readonly stackConfig: NgxPerfectStackConfig,
  ) {
    super();
    const dateFormat = stackConfig.dateFormat ? stackConfig.dateFormat : 'yyyy-MM-dd';
    this.dateFormatter = DateTimeFormatter.ofPattern(dateFormat).withLocale(Locale.ENGLISH);
  }

  parse(value: string): NgbDateStruct | null {
    if (value) {
      const date = LocalDateTime.parse(value, this.dateFormatter);
      return {
        year: date.year(),
        month: date.monthValue(),
        day: date.dayOfMonth()
      }
    }
    return null;
  }

  format(date: NgbDateStruct | null): string {
    return date ? this.dateFormatter.format(LocalDate.of(date.year, date.month, date.day)) : '';
  }

  formatDatabaseValue(databaseValue: string) {
    const isoDate = LocalDate.parse(databaseValue);
    return this.dateFormatter.format(isoDate);
  }
}
