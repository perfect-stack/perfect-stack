import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR, NgControl} from '@angular/forms';
import {MetaAttribute} from '../../../../../domain/meta.entity';
import {ValidationResult} from '../../../../../domain/meta.rule';
import {Subscription} from 'rxjs';
import {FormControlWithAttribute} from '../../../../data-edit/form-service/form.service';

@Component({
  selector: 'lib-enumeration-control',
  templateUrl: './enumeration-control.component.html',
  styleUrls: ['./enumeration-control.component.css'],
  //providers: [{provide: NG_VALUE_ACCESSOR, useExisting: EnumerationControlComponent, multi: true}]
})
export class EnumerationControlComponent implements OnInit, OnDestroy, ControlValueAccessor {

  @Input()
  mode: string | null;

  @Input()
  attribute: MetaAttribute;

  @Input()
  options: string[] = [];

  selectedOption: string;
  disabled = false;

  touched = false;
  touchSubscription: Subscription;

  constructor(public ngControl: NgControl) {
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

    if(this.attribute && this.attribute.enumeration) {
      this.options = this.attribute.enumeration;
    }
    // if no enumeration supplied by the MetaAttribute then the options can be @Input() directly. See "SelectTwoControl"
  }

  isReadOnly() {
    return this.mode === 'view';
  }

  set value(val: string){
    this.selectedOption = val
    this.onChange(val)
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

  hasErrors() {
    return this.ngControl.errors !== null;
  }

  get validationResult() {
    return this.ngControl.errors as ValidationResult;
  }

  onSelectOption(option: string) {
    this.value = option;
  }

  ngOnDestroy(): void {
    if (this.touchSubscription) {
      this.touchSubscription.unsubscribe();
    }
  }
}
