import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {ControlValueAccessor, NgControl} from '@angular/forms';
import {CellAttribute} from '../../../../../meta/page/meta-page-service/meta-page.service';
import {Subscription} from 'rxjs';
import {FormControlWithAttribute} from '../../../../data-edit/form-service/form.service';
import {ValidationResult} from '../../../../../domain/meta.rule';

@Component({
  selector: 'lib-select-multiple-control',
  templateUrl: './select-multiple-control.component.html',
  styleUrls: ['./select-multiple-control.component.css']
})
export class SelectMultipleControlComponent implements OnInit, OnDestroy, ControlValueAccessor {

  @Input()
  mode: string;

  @Input()
  cell: CellAttribute;


  disabled = false;

  touched = false;
  touchSubscription: Subscription;

  optionList = [
    'Beech forest',
    'Podocarp forest',
    'Broadleaf forest',
    'Exotic',
    'Scrub',
    'Logged',
    'Burnt',
    'Undeveloped farmland',
    'Developed farmland',
    'Grassland',
    'Tussock',
    'Swamp',
    'Coastal',
    'Beach',
    'River terrace',
    'Alpine',
    'Other',
  ];

  selectedOptions: string[] = [];

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

  isReadOnly() {
    return this.mode === 'view' ? true : false;
  }

  get name() {
    return this.cell.attribute ? this.cell.attribute.name : '';
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

  writeValue(entityValue: any): void {
    this.selectedOptions = this.convertToOptionList(entityValue);
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

  onItemSelected(item: string) {
    console.log(`Item selected: ${item}`);
    const alreadySelected = this.selectedOptions.findIndex(s => s === item) > -1;
    if(!alreadySelected) {
      this.selectedOptions.push(item);
      this.updateEntityValue();
    }
  }

  onItemDeleted(option: string, $event :MouseEvent) {
    $event.stopPropagation();
    console.log('onItemDeleted', $event);
    this.selectedOptions = this.selectedOptions.filter( s => s !== option);
    this.updateEntityValue();
  }

  updateEntityValue() {
    const entityValue = this.convertToEntityValue(this.selectedOptions);
    this.onChange(entityValue);
  }

  convertToOptionList(entityValue: string): string[] {
    return entityValue.length > 0 ? entityValue.split(',') : [];
  }

  convertToEntityValue(optionList: string[]): string {
    return optionList.join(',');
  }
}
