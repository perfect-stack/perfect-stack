import {ChangeDetectorRef, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {ControlValueAccessor, NgControl} from '@angular/forms';
import {CellAttribute} from '../../../../../meta/page/meta-page-service/meta-page.service';
import {FormControlWithAttribute} from '../../../../data-edit/form-service/form.service';
import {ValidationResult} from '../../../../../domain/meta.rule';

@Component({
  selector: 'lib-url-field-control',
  templateUrl: './url-field-control.component.html',
  styleUrls: ['./url-field-control.component.css'],
  standalone: false
})
export class UrlFieldControlComponent implements OnInit, OnDestroy, ControlValueAccessor {

  @Input()
  mode: string;

  @Input()
  cell: CellAttribute;

  @Input()
  idSuffix?: string | null;

  internalValue: any;

  disabled = false;

  get formControl(): FormControlWithAttribute | null {
    return this.ngControl.control instanceof FormControlWithAttribute ? this.ngControl.control : null;
  }

  get touched(): boolean {
    return this.formControl ? this.formControl.touchedSignal() : (this.ngControl.control?.touched ?? false);
  }

  constructor(public ngControl: NgControl, private cdr: ChangeDetectorRef) {
    ngControl.valueAccessor = this;
  }

  ngOnInit(): void {
    if (!this.formControl) {
      console.warn(`This component is NOT using a FormControlWithAttribute`);
    }
  }

  isReadOnly() {
    return this.mode === 'view';
  }

  get name() {
    return this.cell.attribute?.name;
  }

  get componentId(): string {
    return this.name ? (this.idSuffix ? `${this.name}-${this.idSuffix}` : this.name) : '';
  }

  set value(val: string) {
    // Reset any error messages now that the user has made a change in the UI
    if (this.ngControl.control && this.ngControl.errors) {
      this.ngControl.control.setErrors(null);
    }

    this.internalValue = val;
    this.onChange(val);
  }

  onChange: any = () => {};
  onTouch: any = () => {};

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  writeValue(obj: any): void {
    if (obj === null || obj === undefined || obj === '') {
      this.internalValue = '';
      this.cdr.markForCheck();
      return;
    }
    this.internalValue = obj;
    this.cdr.markForCheck();
  }

  onModelChange(nextValue: any) {
    this.value = nextValue;
  }

  hasErrors() {
    return this.formControl ? this.formControl.hasErrorsSignal() : (this.ngControl.errors !== null);
  }

  get validationResult() {
    return (this.formControl ? this.formControl.errorsSignal() : this.ngControl.errors) as ValidationResult;
  }

  ngOnDestroy(): void {
  }
}
