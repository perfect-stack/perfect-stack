import {Component, Inject, Input, OnInit} from '@angular/core';
import {UntypedFormGroup} from '@angular/forms';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../../../../../ngx-perfect-stack-config';
import {Locale} from '@js-joda/locale_en';
import {DateTimeFormatter, Instant, LocalTime, ZonedDateTime, ZoneId} from '@js-joda/core';

@Component({
  selector: 'lib-flexible-date-time-control',
  templateUrl: './flexible-date-time-control.component.html',
  styleUrls: ['./flexible-date-time-control.component.css']
})
export class FlexibleDateTimeControlComponent implements OnInit {

  @Input()
  mode: string | null;

  @Input()
  formGroup: UntypedFormGroup;

  @Input()
  name: string;

  dateTimeValue: string;

  timeOptionSelected = '';
  timeOptions: TimeOption[] = [
    {
      name: 'Day',
      time: '12:00'
    },
    {
      name: 'Night',
      time: '11:59'
    },
    {
      name: 'Unknown',
      time: '00:00'
    }
  ];

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

  onClick(option: TimeOption) {
    this.timeOptionSelected = option.name;
    console.log(`Set time: ${option.time}`);

    const formControl = this.formGroup.controls[this.name];
    if(formControl) {
      const newTimeValue = LocalTime.parse(option.time);
      const currentUtc = Instant.parse(formControl.value);
      let newZonedDateTime = ZonedDateTime.ofInstant(currentUtc, ZoneId.of('Pacific/Auckland')).withHour(newTimeValue.hour()).withMinute(newTimeValue.minute());
      const newUtc = newZonedDateTime.toInstant();

      const newFormControlValue = newUtc.toString();
      console.log(`Current Form value: ${formControl.value}`);
      console.log(`Update time ${option.time}`);
      console.log(`Zoned: ${newZonedDateTime}`);
      console.log(`New Form value: ${newFormControlValue}`);
    }
  }

  resetTime() {
    this.timeOptionSelected = '';
    console.log(`Set time: 00:00`);
  }
}

export class TimeOption {
  name: string;
  time: string;
}
