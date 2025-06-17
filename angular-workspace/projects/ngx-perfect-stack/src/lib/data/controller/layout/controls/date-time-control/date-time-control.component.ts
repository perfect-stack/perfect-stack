import {Component, Inject, Input, OnInit} from '@angular/core';
import {UntypedFormGroup} from '@angular/forms';
import {DateTimeFormatter, LocalDate, ZonedDateTime, ZoneId} from '@js-joda/core';
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
export class DateTimeControlComponent implements OnInit {

  @Input()
  mode: string | null;

  @Input()
  cell: CellAttribute;

  @Input()
  formGroup: UntypedFormGroup;

  @Input()
  name: string;

  dateTimeValue: string;

  constructor(@Inject(STACK_CONFIG) protected readonly stackConfig: NgxPerfectStackConfig) {
    Locale.getAvailableLocales();
  }

  ngOnInit(): void {
    if(this.mode !== 'edit') {
      const formControl = this.formGroup.controls[this.name];
      const databaseValue = formControl.value;
      if(databaseValue) {
        const dateTimeFormat = this.stackConfig.dateTimeFormat;
        const dateTimeFormatter = DateTimeFormatter.ofPattern(dateTimeFormat).withLocale(Locale.US);

        let zonedDateTime = ZonedDateTime.parse(databaseValue);
        const zoneId = ZoneId.of('Pacific/Auckland');
        zonedDateTime = zonedDateTime.withZoneSameInstant(zoneId);

        this.dateTimeValue = dateTimeFormatter.format(zonedDateTime);
      }
    }
  }

}
