import {ChangeDetectorRef, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {ControlValueAccessor, NgControl} from '@angular/forms';
import {AttributeType} from '../../../../../domain/meta.entity';
import {CellAttribute} from '../../../../../meta/page/meta-page-service/meta-page.service';
import {FormControlWithAttribute} from '../../../../data-edit/form-service/form.service';
import {ValidationResult} from '../../../../../domain/meta.rule';

@Component({
    selector: 'lib-text-field-control',
    templateUrl: './text-field-control.component.html',
    styleUrls: ['./text-field-control.component.css'],
    standalone: false
})
export class TextFieldControlComponent implements OnInit, OnDestroy, ControlValueAccessor {

  @Input()
  mode: string;

  // @Input()
  // name: string;

  // @Input()
  // formGroup: FormGroup;

  @Input()
  cell: CellAttribute;

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
    if(!this.formControl) {
      console.warn(`This component is NOT using a FormControlWithAttribute`);
    }
  }

  isReadOnly() {
    return this.mode === 'view' ? true : false;
  }

  get name() {
    return this.cell.attribute?.name;
  }

  get inputType() {
    return this.cell.attribute && this.cell.attribute.type === AttributeType.Integer ? 'number' : 'text';
  }

  set value(val: string) {

    let nextValue = val;
    if(this.cell && this.cell.attribute) {
      if(this.cell.attribute?.type === AttributeType.Double) {
        nextValue = this.changeScaleOfNumber(nextValue, this.cell.attribute.scale);
      }

      if(this.cell.attribute?.type === AttributeType.Integer) {
        nextValue = this.changeScaleOfNumber(nextValue, 0);
      }
    }

    // Reset any error messages now that the user has made a change in the UI
    if(this.ngControl.control && this.ngControl.errors) {
      this.ngControl.control.setErrors(null);
    }

    this.internalValue = nextValue
    this.onChange(val)
    //this.onTouch(val)
  }

  changeScaleOfNumber(number: any, scale: any) {

    // escape hatch for typing a negative number
    if(number === '-') {
      return number;
    }

    const currentScale = this.getScale(number);
    if(currentScale > scale) {
      return Number(number).toFixed(Number(scale)).toString();
    }
    else {
      return Number(number).toString();
    }
  }

  getScale(number: any) {
    const numberStr = String(number);
    const decimalPoint = numberStr.indexOf('.');
    return decimalPoint >= 0 ? numberStr.length - decimalPoint : 0;
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
    if (obj === null || obj === undefined || obj === "") {
      this.internalValue = "";
      this.cdr.markForCheck();
      return;
    }
    let nextValue = obj;
    if (this.cell && this.cell.attribute) {
      if (this.cell.attribute?.type === AttributeType.Double) {
        nextValue = this.changeScaleOfNumber(nextValue, this.cell.attribute.scale);
      }
      if (this.cell.attribute?.type === AttributeType.Integer) {
        nextValue = this.changeScaleOfNumber(nextValue, 0);
      }
    }
    this.internalValue = nextValue;
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
