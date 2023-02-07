import {Component, Inject, Input, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {ControlValueAccessor, NgControl} from '@angular/forms';
import {NgbDate, NgbInputDatepicker} from '@ng-bootstrap/ng-bootstrap';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../../../../../ngx-perfect-stack-config';
import {
  DateTimeFormatter,
  LocalDate,
  ZonedDateTime,
  ZoneId
} from '@js-joda/core';

// This next import may appear to be grey and unused, but it is important because it imports the right language/words for
// when date time formats use text days and months and not just numerical values
import {Locale} from '@js-joda/locale_en';
import '@js-joda/timezone';
import {MetaAttribute} from '../../../../../domain/meta.entity';
import {ValidationResult} from '../../../../../domain/meta.rule';
import {Subscription} from 'rxjs';
import {FormControlWithAttribute} from '../../../../data-edit/form-service/form.service';
import {TimeService} from '../../../../../utils/time/time.service';

@Component({
  selector: 'app-date-picker-control',
  templateUrl: './date-picker-control.component.html',
  styleUrls: ['./date-picker-control.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class DatePickerControlComponent implements OnInit, OnDestroy, ControlValueAccessor {

  @Input()
  mode: string | null;

  @Input()
  attribute: MetaAttribute;

  @Input()
  includesTimeValue = false;

  @Input()
  parentDisplaysError = false;

  @Input()
  disabled = false;

  dateModel: string | null;

  touched = false;
  touchSubscription: Subscription;
  subscription: Subscription | undefined;

  internalFormModel: string;

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

    this.subscription = this.ngControl.valueChanges?.subscribe((nextValue: any) => {
      console.log('DATE valueChange', nextValue);
      this.writeValue(nextValue);
    });
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
    console.log(` - currentValue = ${this.ngControl.value}`);
    console.log(` - internalFormModel = ${this.internalFormModel}`);

    if(this.includesTimeValue) {
      const formValue = this.internalFormModel;
      const newFormValue = this.timeService.mergeDate(formValue, LocalDate.of(date.year, date.month, date.day));
      console.log(` - newFormValue = ${newFormValue}`);
      this.onChange(newFormValue);
    }
    else {
      const localDate = LocalDate.of(date.year, date.month, date.day);
      const dateFormat = DateTimeFormatter.ofPattern('yyyy-MM-dd'); // This is always this format because it's a database value
      const newFormValue = dateFormat.format(localDate);
      console.log(` - newFormValue = ${newFormValue}`);
      this.onChange(newFormValue);
    }
  }

  writeValue(value: any): void {
    console.log(`@@@-D ${this.attribute?.name} writeValue() "${value}"`)
    this.internalFormModel = value;

    if(value) {
      if(value.length > 10) {
        try {
          let zonedDateTime = ZonedDateTime.parse(value);
          zonedDateTime = zonedDateTime.withZoneSameInstant(ZoneId.of('Pacific/Auckland'));
          const controlFormat = DateTimeFormatter.ofPattern('yyyy-MM-dd');
          this.dateModel = controlFormat.format(zonedDateTime);
          console.log(`dateModel = ${this.dateModel}`);
        }
        catch (e) {
          this.dateModel = null;
        }
      }
      else {
        // TODO: we need to migrate all of the date values in the database??
        this.dateModel = value;
      }
    }
    else {
      this.dateModel = null;
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
