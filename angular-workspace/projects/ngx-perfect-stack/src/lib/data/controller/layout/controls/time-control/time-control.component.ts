import {Component, Inject, Input, OnDestroy, OnInit} from '@angular/core';
import {ControlValueAccessor, NgControl, UntypedFormGroup} from '@angular/forms';
import {
  DateTimeFormatter, Duration,
  LocalTime,
  ZonedDateTime,
  ZoneId,
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

  modifierList: Modifier[] = [
    {label: '+1 hr', duration: 'PT1H'},
    {label: '+2 hrs', duration: 'PT2H'},
    {label: '+3hrs', duration: 'PT3H'},
  ];

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

    this.subscription = this.ngControl.valueChanges?.subscribe((nextValue) => {
      console.log('TIME valueChange', nextValue);
      this.writeValue(nextValue);
    });
  }

  get isReadOnly() {
    return this.mode === 'view' || this.disabled ? true : null;
  }

  /**
   * This is called by the "modifier" shortcuts beneath the input field.
   */
  onModify(modifier: Modifier, $event: MouseEvent) {
    console.log(`Modify time: `, modifier);

    if(this.includesDate) {
      const controlValue = this.ngControl.value;

      console.log(`Current controlValue:`, controlValue);
      if(controlValue) {
        let dateTimeComponents = this.timeService.parseDateTimeFormValue(controlValue);
        console.log(`dateTimeComponents:`, dateTimeComponents);

        if(dateTimeComponents.dateTime) {
          const duration = Duration.parse(modifier.duration);
          let newDateTime = dateTimeComponents.dateTime.plus(duration).toString();

          // The modifier needs to change both the form value and the UI value
          this.onChange(newDateTime);
          this.writeValue(newDateTime);
          console.log(`newDateTime:`, newDateTime);
        }
      }
    }
    else {
      throw new Error('TODO: not implemented yet for this use case');
      // const dateFormat = DateTimeFormatter.ofPattern('HH:mm:ss'); // This is always this format because it's a database value
      // const newFormValue = dateFormat.format(localTime);
      // console.log(` - newFormValue = ${newFormValue}`);
      // this.writeValue(newFormValue);
    }
  }

  onTimeChanged(event$: any) {
    const value = event$.target.value;
    console.log(`onTimeChanged: value = ${value}`);
    const localTime = LocalTime.parse(value);
    console.log(`onTimeChanged: localTime = ${localTime}`);

    if(this.includesDate) {
      const formValue = this.ngControl.value;
      console.log(` - formValue = ${formValue}`);
      const newFormValue = this.timeService.mergeTime(formValue, localTime);
      console.log(` - newFormValue = ${newFormValue}`);
      this.onChange(newFormValue);
    }
    else {
      const dateFormat = DateTimeFormatter.ofPattern('HH:mm:ss'); // This is always this format because it's a database value
      const newFormValue = dateFormat.format(localTime);
      console.log(` - newFormValue = ${newFormValue}`);
      this.onChange(newFormValue);
    }
  }

  writeValue(value: any): void {
    console.log(`@@@-T ${this.cell.attribute?.name} set value "${value}"`)
    if(value) {
      if(value.length < 10) {
        // This might be; empty string, just a time or just a date. Try to parse, but if it fails then that ok and just set to null
        try {
          let localTime = LocalTime.parse(value);
          const timeFormat = DateTimeFormatter.ofPattern('HH:mm');
          this.timeModel = timeFormat.format(localTime);
        }
        catch (e) {
          this.timeModel = null;
        }
      }
      else {
        try {
          let zonedDateTime = ZonedDateTime.parse(value);
          zonedDateTime = zonedDateTime.withZoneSameInstant(ZoneId.of('Pacific/Auckland'));
          const timeFormat = DateTimeFormatter.ofPattern('HH:mm');
          this.timeModel = timeFormat.format(zonedDateTime);
        }
        catch (e) {
          this.timeModel = null;
        }
      }
    }
    else {
      this.timeModel = null;
    }
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


class Modifier {
  label: string;
  duration: string;
}
