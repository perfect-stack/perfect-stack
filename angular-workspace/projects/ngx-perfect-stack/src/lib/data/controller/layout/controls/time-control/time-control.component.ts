import {Component, Inject, Input, OnInit} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {DateTimeFormatter, Instant, LocalDateTime, LocalTime, ZonedDateTime, ZoneId, ZoneOffset} from '@js-joda/core';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../../../../../ngx-perfect-stack-config';
import '@js-joda/locale_en';
import '@js-joda/timezone';


@Component({
  selector: 'lib-time-control',
  templateUrl: './time-control.component.html',
  styleUrls: ['./time-control.component.css']
})
export class TimeControlComponent implements OnInit {

  @Input()
  mode: string | null;

  @Input()
  formGroup: FormGroup;

  @Input()
  name: string;

  timeModel: string | null = null;

  constructor(
    @Inject(STACK_CONFIG)
    protected readonly stackConfig: NgxPerfectStackConfig,
  ) {
  }

  ngOnInit(): void {
    const formControl = this.formGroup.controls[this.name];
    if(formControl) {
      let currentValue = formControl.value;
      if(currentValue) {
        let zonedDateTime = ZonedDateTime.parse(currentValue);
        zonedDateTime = zonedDateTime.withZoneSameInstant(ZoneId.of('Pacific/Auckland'));
        const timeFormat = DateTimeFormatter.ofPattern('HH:mm');
        this.timeModel = timeFormat.format(zonedDateTime);
      }
    }
  }

  get isReadOnly() {
    return this.mode === 'view' ? true : null;
  }

  onTimeChanged($event: any) {
    const value = $event.target.value;
    const newTimeValue = LocalTime.parse(value);
    console.log(`System zoneId = ${ZoneId.systemDefault()}`);
    console.log(`onTimeChanged: ${newTimeValue}`);

    const formControl = this.formGroup.controls[this.name];
    if(formControl) {
      let formValue = formControl.value;

      if(formValue.length === 0) {
        formValue = '2022-01-01 00:00';
      }

      if(formValue.length <= 10) {
        formValue = formValue + ' 00:00';
      }

      console.log(` - formValue = "${formValue}"`);

      const utc = Instant.parse(formValue)
      console.log(` - instant = "${utc}"`);

      let timeValue = ZonedDateTime.ofInstant(utc, ZoneId.of('Pacific/Auckland')).withHour(newTimeValue.hour()).withMinute(newTimeValue.minute());
      console.log(` - timeValue adjusted = "${timeValue}"`);

      const newFormValue = timeValue.toInstant().toString();
      console.log(` - newFormValue = "${newFormValue}"`);

      formControl.setValue(newFormValue, {emitEvent: false});
    }
  }

  onCancel($event: any) {
    console.log('onCancel()');
  }

  onClosed() {
    console.log('onClosed');
  }
}
