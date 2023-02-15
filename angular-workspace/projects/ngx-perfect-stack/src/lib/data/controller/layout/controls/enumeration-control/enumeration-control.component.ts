import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, ControlValueAccessor, FormGroup, NG_VALUE_ACCESSOR, NgControl} from '@angular/forms';
import {MetaAttribute} from '../../../../../domain/meta.entity';
import {ValidationResult} from '../../../../../domain/meta.rule';
import {Subscription} from 'rxjs';
import {FormContext, FormControlWithAttribute} from '../../../../data-edit/form-service/form.service';
import {CellAttribute} from '../../../../../meta/page/meta-page-service/meta-page.service';
import {SelectControlComponent} from '../select-control/select-control.component';
import {control} from 'leaflet';
import {DataService} from '../../../../data-service/data.service';

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
  ctx: FormContext;

  @Input()
  cell: CellAttribute;

  @Input()
  attribute: MetaAttribute;

  // This one is needed because sometimes we need to lookup a sibling control for the "dependsOn" relationships
  @Input()
  formGroup: FormGroup;

  @Input()
  options: string[] = [];

  selectedOption: string | null;
  disabled = false;

  touched = false;
  touchSubscription: Subscription;

  constructor(public ngControl: NgControl,
              protected readonly dataService: DataService) {
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
    else if(this.cell && this.cell.dependsOn) {
      if(this.formGroup) {
        const control = this.getSourceControl();
        if(control) {
          control.valueChanges.subscribe((value) => {
            console.warn(`EnumerationControl: new dependent value; ${value}`, control);
            this.updateOptionList();
          });

          // pump once to initialise
          this.updateOptionList();
        }
        else {
          console.warn(`Unable to find control for ${this.cell.dependsOn}`);
        }
      }
      else {
        console.warn(`Unable to find form`);
      }
    }
    // if no enumeration supplied by the MetaAttribute then the options can be @Input() directly. See "SelectTwoControl"

  }

  getSourceControl(): FormControlWithAttribute | null {
    if(this.cell.dependsOn) {
      return this.formGroup.controls[this.cell.dependsOn] as FormControlWithAttribute;
    }
    else {
      return null;
    }
  }

  updateOptionList() {
    const control = this.getSourceControl();
    if(control && control.attribute) {
      const sourceEntityName = control.attribute.relationshipTarget;
      this.dataService.findById(sourceEntityName, control.value).subscribe((sourceEntity: any) => {
        console.log('sourceEntity:', sourceEntity);
        this.options = [];
        // TODO: need to have a meta value here to define which bit of data contains the "secondaryAttributeName"
        const secondaryAttributeName = 'form';
        if(sourceEntity[secondaryAttributeName]) {
          const valueList: string = sourceEntity[secondaryAttributeName];
          if(valueList) {
            this.options = valueList.split(',').map(value => value.trim());
          }
        }

        // blank the selectedOption if it does not exist in the list
        if(this.selectedOption && this.options.indexOf(this.selectedOption) < 0) {
          this.selectedOption = null;
        }
      });
    }
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
