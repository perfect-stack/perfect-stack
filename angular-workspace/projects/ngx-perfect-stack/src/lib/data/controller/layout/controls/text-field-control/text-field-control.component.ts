import {Component, Input, OnInit} from '@angular/core';
import {ControlValueAccessor, NgControl} from '@angular/forms';
import {AttributeType} from '../../../../../domain/meta.entity';
import {CellAttribute} from '../../../../../meta/page/meta-page-service/meta-page.service';

@Component({
  selector: 'lib-text-field-control',
  templateUrl: './text-field-control.component.html',
  styleUrls: ['./text-field-control.component.css']
})
export class TextFieldControlComponent implements OnInit, ControlValueAccessor {

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

  constructor(public ngControl: NgControl) {
    ngControl.valueAccessor = this;
  }

  ngOnInit(): void {
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

    this.internalValue = nextValue
    this.onChange(val)
    //this.onTouch(val)
  }

  changeScaleOfNumber(number: any, scale: any) {
    return Number(number).toFixed(Number(scale));
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

  onModelChange(nextValue: any) {
    this.value = nextValue;
  }
}

