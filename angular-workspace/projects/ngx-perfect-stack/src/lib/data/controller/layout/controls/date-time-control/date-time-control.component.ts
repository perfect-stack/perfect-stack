import {ChangeDetectorRef, Component, Inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {AbstractControl, UntypedFormGroup, ValidationErrors, ValidatorFn} from '@angular/forms';
import {DateTimeFormatter, LocalDate, ZonedDateTime, ZoneId} from '@js-joda/core';
import {Subscription} from 'rxjs';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../../../../../ngx-perfect-stack-config';

// This next import may appear to be grey and unused, but it is important because it imports the right language/words for
// when date time formats use text days and months and not just numerical values
import {Locale} from '@js-joda/locale_en';
import '@js-joda/timezone';
import {CellAttribute} from '../../../../../meta/page/meta-page-service/meta-page.service';
import {DateTimePrecision} from '../../../../../domain/meta.page';
import {ResultType} from '../../../../../domain/meta.rule';

export { DateTimePrecision };

@Component({
    selector: 'lib-date-time-control',
    templateUrl: './date-time-control.component.html',
    styleUrls: ['./date-time-control.component.css'],
    standalone: false
})
export class DateTimeControlComponent implements OnInit, OnChanges, OnDestroy {

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
  isTimeActive: boolean = false;
  private userActivatedTime: boolean = false;

  private valueSubscription?: Subscription;

  private timeRequiredValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    if (this.precision !== DateTimePrecision.MandatoryTime) {
      return null;
    }
    const val = control.value;
    if (!val) {
      return null;
    }
    const hasTime = typeof val === 'string' && (val.includes('T') || (val.length <= 8 && val.includes(':')));
    if (!hasTime) {
      return {
        name: 'timeRequired',
        resultType: ResultType.Error,
        message: 'Time is required',
      } as any;
    }
    return null;
  };

  constructor(@Inject(STACK_CONFIG) protected readonly stackConfig: NgxPerfectStackConfig,
              protected readonly cdr: ChangeDetectorRef) {
    Locale.getAvailableLocales();
  }

  ngOnInit(): void {
    this.syncTimeActiveFromValue();
    this.updateValue();
    this.setupValueSubscription();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['formGroup'] || changes['name'] || changes['cell']) {
      this.userActivatedTime = false;
      this.syncTimeActiveFromValue();
      this.setupValueSubscription();
    }
    this.updateValue();
    this.cdr.markForCheck();
  }

  get precision(): DateTimePrecision {
    const p = (this.cell?.componentData as any)?.precision ||
              (this.cell as any)?.precision ||
              (this.cell?.componentData as any)?.dateMode;
    if (p) {
      if (p === 'DateOnly' || p === DateTimePrecision.DateOnly) return DateTimePrecision.DateOnly;
      if (p === 'OptionalTime' || p === DateTimePrecision.OptionalTime) return DateTimePrecision.OptionalTime;
      if (p === 'MandatoryTime' || p === DateTimePrecision.MandatoryTime) return DateTimePrecision.MandatoryTime;
    }
    if (this.isDateOnlyLegacy) {
      return DateTimePrecision.DateOnly;
    }
    return DateTimePrecision.OptionalTime;
  }

  get isDateOnlyLegacy(): boolean {
    return ['Date', 'DatePicker', 'DateOnly'].includes(this.cell?.component || '') ||
           ['Date', 'DatePicker', 'DateOnly'].includes(this.cell?.options || '');
  }

  get isDateOnly(): boolean {
    return this.precision === DateTimePrecision.DateOnly;
  }

  get isMandatoryTime(): boolean {
    return this.precision === DateTimePrecision.MandatoryTime;
  }

  get isOptionalTime(): boolean {
    return this.precision === DateTimePrecision.OptionalTime;
  }

  get componentId(): string {
    const base = this.cell?.attribute?.name || this.name || '';
    return base ? (this.idSuffix ? `${base}-${this.idSuffix}` : base) : '';
  }

  hasTimeValue(val: any): boolean {
    return typeof val === 'string' && (val.includes('T') || (val.length <= 8 && val.includes(':')));
  }

  syncTimeActiveFromValue(): void {
    if (this.isMandatoryTime) {
      this.isTimeActive = true;
      return;
    }
    if (this.isDateOnly) {
      this.isTimeActive = false;
      return;
    }
    const formControl = this.formGroup?.controls[this.name];
    const val = formControl?.value;
    this.isTimeActive = this.userActivatedTime || this.hasTimeValue(val);
  }

  activateTime(): void {
    this.userActivatedTime = true;
    this.isTimeActive = true;
    this.cdr.markForCheck();
  }

  deactivateTime(): void {
    this.userActivatedTime = false;
    this.isTimeActive = false;
    const formControl = this.formGroup?.controls[this.name];
    if (formControl) {
      const val = formControl.value;
      if (val instanceof Date) {
        formControl.setValue(val.toISOString().substring(0, 10));
      } else if (typeof val === 'string' && val.length >= 10 && val.includes('-')) {
        formControl.setValue(val.substring(0, 10));
      } else {
        formControl.setValue('');
      }
    }
    this.updateValue();
    this.cdr.markForCheck();
  }

  setupValueSubscription(): void {
    if (this.valueSubscription) {
      this.valueSubscription.unsubscribe();
      this.valueSubscription = undefined;
    }
    const formControl = this.formGroup?.controls[this.name];
    if (formControl) {
      formControl.removeValidators(this.timeRequiredValidator);
      formControl.addValidators(this.timeRequiredValidator);
      formControl.updateValueAndValidity({ emitEvent: false });

      this.valueSubscription = formControl.valueChanges.subscribe((val) => {
        if (!val || (typeof val === 'string' && !val.includes('T') && !val.includes(':'))) {
          this.userActivatedTime = false;
        }
        if (this.hasTimeValue(val)) {
          this.isTimeActive = true;
        } else if (!this.userActivatedTime && !this.isMandatoryTime) {
          this.isTimeActive = false;
        }
        this.updateValue();
        this.cdr.markForCheck();
      });
    }
  }

  updateValue(): void {
    if(this.mode !== 'edit' && this.formGroup && this.name) {
      const formControl = this.formGroup.controls[this.name];
      const databaseValue = formControl?.value;
      if(databaseValue) {
        const hasTime = typeof databaseValue === 'string' && (databaseValue.includes('T') || databaseValue.includes(':'));
        const formatAsDateOnly = this.isDateOnly || (!hasTime && typeof databaseValue === 'string' && databaseValue.length <= 10);

        if (formatAsDateOnly) {
          const dateFormatter = DateTimeFormatter.ofPattern(this.stackConfig.dateFormat).withLocale(Locale.US);
          try {
            const dateStr = typeof databaseValue === 'string' ? databaseValue.substring(0, 10) : databaseValue;
            const localDate = LocalDate.parse(dateStr);
            this.dateTimeValue = dateFormatter.format(localDate);
          } catch (e) {
            try {
              const zoneId = ZoneId.of('Pacific/Auckland');
              const zdt = ZonedDateTime.parse(databaseValue).withZoneSameInstant(zoneId);
              this.dateTimeValue = dateFormatter.format(zdt);
            } catch (e2) {
              this.dateTimeValue = String(databaseValue);
            }
          }
        } else {
          const dateTimeFormatter = DateTimeFormatter.ofPattern(this.stackConfig.dateTimeFormat).withLocale(Locale.US);
          const zoneId = ZoneId.of('Pacific/Auckland');
          let zonedDateTime: ZonedDateTime;
          try {
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
          } catch (e) {
            this.dateTimeValue = String(databaseValue);
          }
        }
      } else {
        this.dateTimeValue = '';
      }
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    if (this.valueSubscription) {
      this.valueSubscription.unsubscribe();
      this.valueSubscription = undefined;
    }
    const formControl = this.formGroup?.controls[this.name];
    if (formControl) {
      formControl.removeValidators(this.timeRequiredValidator);
      formControl.updateValueAndValidity({ emitEvent: false });
    }
  }

}
