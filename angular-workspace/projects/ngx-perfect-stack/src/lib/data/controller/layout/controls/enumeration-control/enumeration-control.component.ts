import {Component, Input, OnInit} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {MetaAttribute} from '../../../../../domain/meta.entity';

@Component({
  selector: 'lib-enumeration-control',
  templateUrl: './enumeration-control.component.html',
  styleUrls: ['./enumeration-control.component.css'],
  providers: [{provide: NG_VALUE_ACCESSOR, useExisting: EnumerationControlComponent, multi: true}]
})
export class EnumerationControlComponent implements OnInit, ControlValueAccessor {

  @Input()
  mode: string | null;

  @Input()
  attribute: MetaAttribute;

  @Input()
  options: string[] = [];

  selectedOption: string;
  disabled = false;

  constructor() { }

  ngOnInit(): void {
    if(this.attribute && this.attribute.enumeration) {
      this.options = this.attribute.enumeration;
    }
    // if no enumeration supplied by the MetaAttribute then the options can be @Input() directly. See "SelectTwoControl"
  }

  isReadOnly() {
    return this.mode === 'view';
  }

  getCSSClass() {
    return this.isReadOnly() ? 'form-control': 'form-select';
  }

  set value(val: string){
    this.selectedOption = val
    this.onChange(val)
    this.onTouch(val)
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
