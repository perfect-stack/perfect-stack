import {Component, Inject, Input, OnInit} from '@angular/core';
import {ControlValueAccessor, NgControl, UntypedFormGroup} from '@angular/forms';
import {
  DateTimeFormatter,
  Instant,
  LocalDateTime,
  LocalTime,
  TemporalAdjusters,
  ZonedDateTime,
  ZoneId,
  ZoneOffset
} from '@js-joda/core';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../../../../../ngx-perfect-stack-config';

// This next import may appear to be grey and unused, but it is important because it imports the right language/words for
// when date time formats use text days and months and not just numerical values
import {Locale} from '@js-joda/locale_en';
import '@js-joda/timezone';
import {CellAttribute} from '../../../../../meta/page/meta-page-service/meta-page.service';


@Component({
  selector: 'lib-time-control',
  templateUrl: './time-control.component.html',
  styleUrls: ['./time-control.component.css']
})
export class TimeControlComponent implements OnInit, ControlValueAccessor {

  @Input()
  mode: string | null;

  // @Input()
  // formGroup: UntypedFormGroup;
  //
  // @Input()
  // name: string;

  @Input()
  cell: CellAttribute;

  timeModel: string | null = null;

  @Input()
  disabled = false;

  constructor(@Inject(STACK_CONFIG)
              protected readonly stackConfig: NgxPerfectStackConfig,
              public ngControl: NgControl) {
    ngControl.valueAccessor = this;
  }

  ngOnInit(): void {
    // const formControl = this.formGroup.controls[this.name];
    // if(formControl) {
    //   let currentValue = formControl.value;
    //   if(currentValue) {
    //     let zonedDateTime = ZonedDateTime.parse(currentValue);
    //     zonedDateTime = zonedDateTime.withZoneSameInstant(ZoneId.of('Pacific/Auckland'));
    //     const timeFormat = DateTimeFormatter.ofPattern('HH:mm');
    //     this.timeModel = timeFormat.format(zonedDateTime);
    //   }
    // }
  }

  get isReadOnly() {
    return this.mode === 'view' || this.disabled ? true : null;
  }

  onTimeChanged(event$: any) {
    const value = event$.target.value;
    const newTimeValue = LocalTime.parse(value);
    console.log(`onTimeChanged: ${newTimeValue}`);

    //const formControl = this.formGroup.controls[this.name];
    const formControl = this.ngControl.control;
    if(formControl) {
      let formValue = formControl.value;

      if(formValue.length === 0) {
        formValue = '2022-01-01 00:00';
      }

      if(formValue.length <= 10) {
        formValue = formValue + ' 00:00';
      }

      console.log(` - formValue = "${formValue}"`);

      const utc = Instant.parse(formValue);
      console.log(` - instant = "${utc}"`);

      let timeValue = ZonedDateTime.ofInstant(utc, ZoneId.of('Pacific/Auckland')).withHour(newTimeValue.hour()).withMinute(newTimeValue.minute());
      console.log(` - timeValue adjusted = "${timeValue}"`);

      const newFormValue = timeValue.toInstant().toString();
      console.log(` - newFormValue = "${newFormValue}"`);

      //formControl.setValue(newFormValue, {emitEvent: false});
      //formControl.setValue(newFormValue);
      //formControl.setValue(newFormValue, {emitEvent: true});
      this.writeValue(newFormValue);
    }
  }

  set value(value: string){
    console.log(`@@@ set value ${value}`)

    if(value) {
      let zonedDateTime = ZonedDateTime.parse(value);
      zonedDateTime = zonedDateTime.withZoneSameInstant(ZoneId.of('Pacific/Auckland'));
      const timeFormat = DateTimeFormatter.ofPattern('HH:mm');
      this.timeModel = timeFormat.format(zonedDateTime);
    }
    else {
      this.timeModel = null;
    }

    this.onChange(value)
    //this.onTouch(val)
  }

  onChange: any = () => {}
  onTouch: any = () => {}

  registerOnChange(fn: any): void {
    this.onChange = fn
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  writeValue(obj: any): void {
    this.value = obj;
  }
}
