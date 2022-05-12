import {Component, Input, OnInit} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {FormControlWithAttribute} from '../../../../data-edit/form-service/form.service';
import {AttributeType, MetaAttribute} from '../../../../../domain/meta.entity';

@Component({
  selector: 'lib-text-field-control',
  templateUrl: './text-field-control.component.html',
  styleUrls: ['./text-field-control.component.css']
})
export class TextFieldControlComponent implements OnInit {

  @Input()
  mode: string;

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

  get attribute(): MetaAttribute | null {
    const formControlWithAttribute = this.formGroup.controls[this.name] as FormControlWithAttribute;
    return formControlWithAttribute ? formControlWithAttribute.attribute : null;
  }

  get inputType() {
    return this.attribute && this.attribute.type === AttributeType.Integer ? 'number' : 'text';
  }
}
