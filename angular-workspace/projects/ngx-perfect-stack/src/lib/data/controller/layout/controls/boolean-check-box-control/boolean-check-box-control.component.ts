import {Component, Input, OnInit} from '@angular/core';
import {UntypedFormGroup} from '@angular/forms';
import {MetaAttribute} from '../../../../../domain/meta.entity';

@Component({
    selector: 'lib-boolean-check-box-control',
    templateUrl: './boolean-check-box-control.component.html',
    styleUrls: ['./boolean-check-box-control.component.css'],
    standalone: false
})
export class BooleanCheckBoxControlComponent implements OnInit {

  @Input()
  mode: string;

  @Input()
  formGroup: UntypedFormGroup;

  @Input()
  attribute: MetaAttribute;

  constructor() { }

  ngOnInit(): void {
  }

  getDisplayValue() {
    const value = this.formGroup.controls[this.attribute.name].value;
    return value ? 'Yes' : 'No';
  }
}
