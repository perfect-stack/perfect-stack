import {Component, Inject, Input, OnInit} from '@angular/core';
import {AbstractControl, UntypedFormGroup} from '@angular/forms';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../../../../../ngx-perfect-stack-config';
import {Locale} from '@js-joda/locale_en';
import {DateTimeFormatter, Instant, LocalTime, ZonedDateTime, ZoneId} from '@js-joda/core';
import {CellAttribute} from '../../../../../meta/page/meta-page-service/meta-page.service';
import {ValidationResult} from '../../../../../domain/meta.rule';
import {TimeService} from '../../../../../utils/time/time.service';

@Component({
    selector: 'lib-flexible-date-time-control',
    templateUrl: './flexible-date-time-control.component.html',
    styleUrls: ['./flexible-date-time-control.component.css'],
    standalone: false
})
export class FlexibleDateTimeControlComponent implements OnInit {

  @Input()
  mode: string | null;

  @Input()
  cell: CellAttribute;

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
      time: '23:59'
    },
    {
      name: 'Unknown',
      time: '00:00'
    }
  ];

  timeInputDisabled = false;

  constructor(@Inject(STACK_CONFIG)
              protected readonly stackConfig: NgxPerfectStackConfig,
              protected readonly timeService: TimeService) {
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

    if(this.mode === 'edit') {
      if(this.timePrecisionControl) {
        const timePrecisionValue = this.timePrecisionControl.value;
        if(timePrecisionValue) {
          this.timeOptionSelected = this.timePrecisionControl.value;
        }
        else {
          // upgrade null value into an exact time
          this.timeOptionSelected = '';
          this.timePrecisionControl.setValue('Exact');
        }
      }
    }
  }

  onClick(option: TimeOption) {
    this.timeOptionSelected = option.name;
    console.log(`Set time: ${option.time}`);

    const formControl = this.formGroup.controls[this.name];
    if(formControl) {
      const newTimeValue = LocalTime.parse(option.time);
      console.log(`Got newTimeValue:`, newTimeValue);
      const newFormControlValue = this.timeService.mergeTime(formControl.value, newTimeValue);

      console.log(`New Form value: ${newFormControlValue}`);
      formControl.setValue(newFormControlValue);
      this.timeInputDisabled = true;

      if(this.timePrecisionControl) {
        this.timePrecisionControl.setValue(option.name);
      }
    }
  }

  get timePrecisionControl(): AbstractControl | null {
    const componentData = this.cell.componentData;
    if(componentData) {
      const secondaryAttributeName = (componentData as any).secondaryAttributeName;
      const timePrecisionControl = this.formGroup.controls[secondaryAttributeName];
      return timePrecisionControl;
    }
    else {
      return null;
    }
  }

  resetTime() {
    this.timeOptionSelected = '';
    this.timeInputDisabled = false;
    console.log(`Set time: 00:00`);
    if(this.timePrecisionControl) {
      this.timePrecisionControl.setValue('Exact');
    }
  }

  hasErrors() {
    const formControl = this.formGroup.controls[this.name];
    return formControl && formControl.errors !== null;
  }

  hasDateErrors() {
    const formControl = this.formGroup.controls[this.name];
    const dateTimeComponents = this.timeService.parseDateTimeFormValue(formControl.value);
    return this.hasErrors() && !dateTimeComponents.date;
  }

  hasTimeErrors() {
    const formControl = this.formGroup.controls[this.name];
    const dateTimeComponents = this.timeService.parseDateTimeFormValue(formControl.value);
    return this.hasErrors() && !dateTimeComponents.time;
  }

  hasDateTimeErrors() {
    const formControl = this.formGroup.controls[this.name];
    const dateTimeComponents = this.timeService.parseDateTimeFormValue(formControl.value);
    return this.hasErrors() && dateTimeComponents.date && dateTimeComponents.time;
  }

  get validationResult() {
    const formControl = this.formGroup.controls[this.name];
    return formControl && formControl.errors as ValidationResult;
  }
}

export class TimeOption {
  name: string;
  time: string;
}
