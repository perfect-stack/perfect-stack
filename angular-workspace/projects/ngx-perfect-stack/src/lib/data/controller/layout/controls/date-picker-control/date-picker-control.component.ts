import {Component, Inject, Input, OnInit, ViewEncapsulation} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {NgbDate, NgbInputDatepicker} from '@ng-bootstrap/ng-bootstrap';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../../../../../ngx-perfect-stack-config';
import {DateTimeFormatter, Instant, LocalDate, ZonedDateTime, ZoneId} from '@js-joda/core';

import {Locale} from '@js-joda/locale_en-us';
import '@js-joda/timezone';

@Component({
  selector: 'app-date-picker-control',
  templateUrl: './date-picker-control.component.html',
  styleUrls: ['./date-picker-control.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class DatePickerControlComponent implements OnInit {

  @Input()
  mode: string | null;

  @Input()
  formGroup: FormGroup;

  @Input()
  name: string;

  @Input()
  includesTimeValue = false;

  dateModel: string | null;

  constructor(@Inject(STACK_CONFIG) protected readonly stackConfig: NgxPerfectStackConfig) { }

  ngOnInit(): void {
    const formControl = this.formGroup.controls[this.name];
    if(formControl) {
      console.log(` - currentValue = ${formControl.value}`);

      const databaseValue = formControl.value;
      if(databaseValue) {
        if(databaseValue.length > 10) {
          let zonedDateTime = ZonedDateTime.parse(databaseValue);
          zonedDateTime = zonedDateTime.withZoneSameInstant(ZoneId.of('Pacific/Auckland'));
          const controlFormat = DateTimeFormatter.ofPattern('yyyy-MM-dd');
          this.dateModel = controlFormat.format(zonedDateTime);
        }
        else {
          // TODO: we need to migrate all of the date values in the database??
          this.dateModel = databaseValue;
        }
      }
      else {
        this.dateModel = null;
      }
    }
  }

  get isReadOnly() {
    return this.mode === 'view' ? true : null;
  }

  get placeholder() {
    return this.isReadOnly ? '—' : this.stackConfig.dateFormat.toLowerCase();
  }

  toggle(datePicker: NgbInputDatepicker) {
    if(!this.isReadOnly) {
      datePicker.toggle();
    }
  }

  onDateSelect(date: NgbDate) {
    console.log(`onDateSelect(): ${JSON.stringify(date)}`);
    const formControl = this.formGroup.controls[this.name];
    if(formControl) {
      console.log(` - currentValue = ${formControl.value}`);
      if(this.includesTimeValue) {
        const formValue = formControl.value;

        let utc;
        if(formValue) {
          utc = Instant.parse(formValue)
        }
        else {
          utc = Instant.now();
        }

        console.log(` - instant = "${utc}"`);

        let dateTimeValue = ZonedDateTime.ofInstant(utc, ZoneId.of('Pacific/Auckland')).withYear(date.year).withMonth(date.month).withDayOfMonth(date.day);
        console.log(` - timeValue adjusted = "${dateTimeValue}"`);

        const newFormValue = dateTimeValue.toInstant().toString();
        console.log(` - newFormValue = "${newFormValue}"`);

        formControl.setValue(newFormValue, {emitEvent: false});

      }
      else {
        const localDate = LocalDate.of(date.year, date.month, date.day);
        const dateFormat = DateTimeFormatter.ofPattern('yyyy-MM-dd');
        const formValue = dateFormat.format(localDate);
        console.log(`set formControl ${this.name} = ${formValue}`);
        formControl.setValue(formValue);
      }
    }
  }
}
