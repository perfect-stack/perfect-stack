import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {CellAttribute} from "../../../../../meta/page/meta-page-service/meta-page.service";
import {Subscription} from "rxjs";
import {ControlValueAccessor, NgControl} from "@angular/forms";
import {FormControlWithAttribute} from "../../../../data-edit/form-service/form.service";
import {AttributeType} from "../../../../../domain/meta.entity";
import {ValidationResult} from "../../../../../domain/meta.rule";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ColourBandDialogComponent} from "./colour-band-dialog/colour-band-dialog.component";



@Component({
    selector: 'lib-colour-band-component',
    templateUrl: './colour-band-component.component.html',
    styleUrls: ['./colour-band-component.component.css'],
    standalone: false
})
export class ColourBandComponentComponent implements OnInit, OnDestroy, ControlValueAccessor {

  @Input()
  mode: string;

  @Input()
  cell: CellAttribute;

  internalValue: any;

  disabled = false;

  touched = false;
  touchSubscription: Subscription;

  constructor(public ngControl: NgControl, private modalService: NgbModal) {
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

  isReadOnly() {
    return this.mode === 'view';
  }

  get name() {
    return this.cell.attribute?.name;
  }

  get inputType() {
    return this.cell.attribute && this.cell.attribute.type === AttributeType.Integer ? 'number' : 'text';
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

  onBandDialogClick() {
    const modalRef = this.modalService.open(ColourBandDialogComponent);
    const colourBandDialog = modalRef.componentInstance as ColourBandDialogComponent;
    colourBandDialog.colourBand = this.internalValue;

    modalRef.closed.subscribe((newValue) => {
      console.log('onBandDialogClick: ', newValue);
      this.value = newValue;
    });
  }
}
