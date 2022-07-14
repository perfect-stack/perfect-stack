import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {ControlValueAccessor, FormGroup, NgControl} from '@angular/forms';
import {MetaAttribute} from '../../../../../domain/meta.entity';
import {Subscription} from 'rxjs';

@Component({
  selector: 'lib-spy-control',
  templateUrl: './spy-control.component.html',
  styleUrls: ['./spy-control.component.css']
})
export class SpyControlComponent implements OnInit, OnDestroy, ControlValueAccessor {

  @Input()
  mode: string;

  @Input()
  formGroup: FormGroup;

  @Input()
  attribute: MetaAttribute;

  disabled = false;


  formGroupSubscription: Subscription;

  constructor(public ngControl: NgControl) {
    ngControl.valueAccessor = this;
  }

  ngOnInit(): void {
    if(this.formGroup && this.attribute) {
      this.formGroupSubscription = this.formGroup.controls[this.attribute.name + '_id'].valueChanges.subscribe((nextValue) => {
        console.log(`Spy detects update in target attribute ${this.attribute.relationshipTarget}`, nextValue);
        // const targetEntity = this.formGroup.controls[this.attribute.name].value;
        // console.log('Spy found targetEntity', targetEntity);
      });
    }
  }

  set value(val: string){

    // spy control doesn't update anything, it only watches the field it's bound to

    // this.selectedEntityId = val
    // this.onChange(val)
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

  ngOnDestroy(): void {
    if(this.formGroupSubscription) {
      this.formGroupSubscription.unsubscribe();
    }
  }
}
