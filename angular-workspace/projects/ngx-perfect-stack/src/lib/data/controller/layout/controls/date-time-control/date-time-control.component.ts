import {Component, Inject, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {UntypedFormGroup} from '@angular/forms';
import {DateTimeFormatter, ZonedDateTime, ZoneId} from '@js-joda/core';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../../../../../ngx-perfect-stack-config';

// This next import may appear to be grey and unused, but it is important because it imports the right language/words for
// when date time formats use text days and months and not just numerical values
import {Locale} from '@js-joda/locale_en';
import '@js-joda/timezone';
import {CellAttribute} from '../../../../../meta/page/meta-page-service/meta-page.service';

@Component({
    selector: 'lib-date-time-control',
    templateUrl: './date-time-control.component.html',
    styleUrls: ['./date-time-control.component.css'],
    standalone: false
})
export class DateTimeControlComponent implements OnInit, OnChanges {

  @Input()
  mode: string | null;

  @Input()
  cell: CellAttribute;

  @Input()
  formGroup: UntypedFormGroup;

  @Input()
  name: string;

  @Input()
  idSuffix?: string | null;

  dateTimeValue: string;

  constructor(@Inject(STACK_CONFIG) protected readonly stackConfig: NgxPerfectStackConfig) {
    Locale.getAvailableLocales();
  }

  ngOnInit(): void {
    this.updateValue();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.updateValue();
  }

  get componentId(): string {
    const base = this.cell?.attribute?.name || this.name || '';
    return base ? (this.idSuffix ? `${base}-${this.idSuffix}` : base) : '';
  }

  updateValue(): void {
    if(this.mode !== 'edit' && this.formGroup && this.name) {
      const formControl = this.formGroup.controls[this.name];
      const databaseValue = formControl?.value;
      if(databaseValue) {
        const isDateOnly = ['Date', 'DatePicker', 'DateOnly'].includes(this.cell?.component || '') ||
                           ['Date', 'DatePicker', 'DateOnly'].includes(this.cell?.options || '');
        const formatPattern = isDateOnly ? this.stackConfig.dateFormat : this.stackConfig.dateTimeFormat;
        const dateTimeFormatter = DateTimeFormatter.ofPattern(formatPattern).withLocale(Locale.US);

        const zoneId = ZoneId.of('Pacific/Auckland');
        let zonedDateTime: ZonedDateTime;
        if (typeof databaseValue === 'string') {
          if (databaseValue.includes('+') || databaseValue.endsWith('Z') || (databaseValue.includes('-') && databaseValue.lastIndexOf('-') > 10)) {
            zonedDateTime = ZonedDateTime.parse(databaseValue).withZoneSameInstant(zoneId);
          } else {
            const normalized = databaseValue.replace(' ', 'T') + 'Z';
            zonedDateTime = ZonedDateTime.parse(normalized).withZoneSameInstant(zoneId);
          }
        } else if (databaseValue instanceof Date) {
          zonedDateTime = ZonedDateTime.parse(databaseValue.toISOString()).withZoneSameInstant(zoneId);
        } else {
          zonedDateTime = ZonedDateTime.parse(databaseValue).withZoneSameInstant(zoneId);
        }

        this.dateTimeValue = dateTimeFormatter.format(zonedDateTime);
      } else {
        this.dateTimeValue = '';
      }
    }
  }

}
