import {Component, Input, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormGroup} from '@angular/forms';
import {MetaAttribute} from '../../../../domain/meta.entity';

@Component({
  selector: 'lib-enumeraton-edit',
  templateUrl: './enumeraton-edit.component.html',
  styleUrls: ['./enumeraton-edit.component.css']
})
export class EnumeratonEditComponent implements OnInit {

  @Input()
  formGroup: FormGroup;

  nextValueFormGroup = this.fb.group({
    nextValue: this.fb.control(''),
  });

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    if(!this.formGroup.get('enumeration')) {
      const metaAttribute = this.formGroup.value;
      EnumeratonEditComponent.addEnumerationFormControl(this.fb, this.formGroup, metaAttribute);
    }
  }

  static addEnumerationFormControl(fb: FormBuilder, formGroup: FormGroup, metaAttribute: MetaAttribute) {
    const formArray = fb.array([]);

    formGroup.addControl('enumeration', formArray);
    for(const nextValue of metaAttribute.enumeration) {
      formArray.push(fb.control(nextValue));
    }
  }

  get formArray() {
    return this.formGroup.controls['enumeration'] as FormArray;
  }

  onAdd(value: string) {
    if(value && !this.valueAlreadyExists(value)) {
      this.formArray.push(this.fb.control(value));
    }
  }

  valueAlreadyExists(value: string) {
    let exists = false;
    for(let i = 0; i < this.formArray.length && !exists; i++) {
      const nextValue = this.formArray.at(i).value;
      if(value === nextValue) {
        exists = true;
      }
    }
    return exists;
  }

  removeValue(i: number) {
    this.formArray.removeAt(i);
  }
}
