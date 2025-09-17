import {Component, Input, OnInit, ViewEncapsulation} from '@angular/core';
import {ControlValueAccessor, NgControl, UntypedFormGroup} from '@angular/forms';
import {Cell} from '../../../../../domain/meta.page';
import {CellAttribute} from "../../../../../meta/page/meta-page-service/meta-page.service";
import {ValidationResult} from "../../../../../domain/meta.rule";
import {FormControlWithAttribute} from "../../../../data-edit/form-service/form.service";
import {Subscription} from "rxjs";

@Component({
    selector: 'lib-text-area-control',
    templateUrl: './text-area-control.component.html',
    styleUrls: ['./text-area-control.component.css'],
    encapsulation: ViewEncapsulation.None,
    standalone: false
})
export class TextAreaControlComponent implements OnInit, ControlValueAccessor {

  @Input()
  mode: string | null;

  @Input()
  formGroup: UntypedFormGroup;

  @Input()
  cell: CellAttribute;

  @Input()
  idSuffix: string;

  internalValue: any;
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

  set value(val: string) {

    let nextValue = val;
    // Reset any error messages now that the user has made a change in the UI
    if(this.ngControl.control && this.ngControl.errors) {
      this.ngControl.control.setErrors(null);
    }

    this.internalValue = nextValue
    this.onChange(val)
    //this.onTouch(val)
  }


  isReadOnly() {
    return this.mode === 'view' ? true : null;
  }

  hasErrors() {
    return this.ngControl.errors !== null;
  }

  get validationResult() {
    return this.ngControl.errors as ValidationResult;
  }

  ngOnDestroy(): void {
    if(this.touchSubscription) {
      this.touchSubscription.unsubscribe();
    }
  }

  get componentId() : string {
    if(this.idSuffix) {
      return this.cell && this.cell.attribute ? `${this.cell.attribute.name}-${this.idSuffix}` : `UNKNOWN-TODO`;
    }
    else {
      return this.cell && this.cell.attribute ? `${this.cell.attribute.name}` : `UNKNOWN-TODO`;
    }
  }

  getCSSHeight(cell: Cell) {
    const height: number = cell && cell.height ? Number(cell.height) : 1;
    const cssHeight = 6 + ((height - 1) * 3) + 1;  // 1, 4
    return `${cssHeight}em`;
  }
}
