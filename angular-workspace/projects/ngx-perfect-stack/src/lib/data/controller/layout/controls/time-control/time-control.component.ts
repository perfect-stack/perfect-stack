import {Component, Inject, Input, OnDestroy, OnInit} from '@angular/core';
import {ControlValueAccessor, NgControl, UntypedFormGroup} from '@angular/forms';
import {
  ChronoField,
  DateTimeFormatter,
  Instant, LocalDate,
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
import {ValidationResult} from '../../../../../domain/meta.rule';
import {Subscription} from 'rxjs';
import {FormControlWithAttribute} from '../../../../data-edit/form-service/form.service';
import {TimeService} from '../../../../../utils/time/time.service';


@Component({
  selector: 'lib-time-control',
  templateUrl: './time-control.component.html',
  styleUrls: ['./time-control.component.css']
})
export class TimeControlComponent implements OnInit, OnDestroy, ControlValueAccessor {

  @Input()
  mode: string | null;

  @Input()
  cell: CellAttribute;

  @Input()
  parentDisplaysError = false;

  @Input()
  includesDate = false;

  @Input()
  disabled = false;

  timeModel: string | null = null;

  touched = false;
  touchSubscription: Subscription;
  subscription: Subscription | undefined;

  constructor(@Inject(STACK_CONFIG)
              protected readonly stackConfig: NgxPerfectStackConfig,
              protected readonly timeService: TimeService,
              public ngControl: NgControl) {
    ngControl.valueAccessor = this;
  }

  ngOnInit(): void {
    if(this.ngControl.control && this.ngControl.control instanceof FormControlWithAttribute) {
      this.touchSubscription = this.ngControl.control.touched$.subscribe(() => {
        this.touched = true;
      });
    }
    else {
      console.warn(`This component is NOT using a FormControlWithAttribute`);
    }

    // this.subscription = this.ngControl.valueChanges?.subscribe((nextValue) => {
    //   console.log('GOT time valueChange', nextValue);
    //   this.updateValue(nextValue, false);
    // });
  }

  get isReadOnly() {
    return this.mode === 'view' || this.disabled ? true : null;
  }

  onTimeChanged(event$: any) {
    const value = event$.target.value;
    const localTime = LocalTime.parse(value);
    console.log(`onTimeChanged: ${localTime}`);

    if(this.includesDate) {
      const formValue = this.ngControl.value;
      const newFormValue = this.timeService.mergeTime(formValue, localTime);
      console.log(` - newFormValue = ${newFormValue}`);
      this.writeValue(newFormValue);
    }
    else {
      const dateFormat = DateTimeFormatter.ofPattern('HH:mm:ss'); // This is always this format because it's a database value
      const newFormValue = dateFormat.format(localTime);
      console.log(` - newFormValue = ${newFormValue}`);
      this.writeValue(newFormValue);
    }
  }

  updateValue(value: string, emitEvent = true){
    console.log(`@@@-T ${this.cell.attribute?.name} set value "${value}"`)

    if(value) {
      if(value.length < 10) {
        let localTime = LocalTime.parse(value);
        const timeFormat = DateTimeFormatter.ofPattern('HH:mm');
        this.timeModel = timeFormat.format(localTime);
      }
      else {
        let zonedDateTime = ZonedDateTime.parse(value);
        zonedDateTime = zonedDateTime.withZoneSameInstant(ZoneId.of('Pacific/Auckland'));
        const timeFormat = DateTimeFormatter.ofPattern('HH:mm');
        this.timeModel = timeFormat.format(zonedDateTime);
      }
    }
    else {
      this.timeModel = null;
    }

    if(emitEvent) {
      this.onChange(value)
    }
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
    this.updateValue(obj);
  }

  hasErrors() {
    return this.ngControl.errors !== null;
  }

  get validationResult() {
    return this.ngControl.errors as ValidationResult;
  }

  ngOnDestroy(): void {
    if (this.touchSubscription) {
      this.touchSubscription.unsubscribe();
    }

    if(this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
