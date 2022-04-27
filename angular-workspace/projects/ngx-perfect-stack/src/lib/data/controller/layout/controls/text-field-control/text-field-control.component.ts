import {Component, Input, OnInit} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {FormControlWithAttribute} from '../../../../data-edit/form-service/form.service';
import {AttributeType} from '../../../../../domain/meta.entity';

@Component({
  selector: 'lib-text-field-control',
  templateUrl: './text-field-control.component.html',
  styleUrls: ['./text-field-control.component.css']
})
export class TextFieldControlComponent implements OnInit {

  @Input()
  mode: string | null;

  @Input()
  name: string;

  @Input()
  formGroup: FormGroup;

  constructor() { }

  ngOnInit(): void {
  }

  isReadOnly() {
    return this.mode === 'view' ? true : false;
  }

  get inputType() {
    const formControlWithAttribute = this.formGroup.controls[this.name] as FormControlWithAttribute;
    const attribute = formControlWithAttribute.attribute;
    return attribute.type === AttributeType.Integer ? 'number' : 'text;'
  }
}
