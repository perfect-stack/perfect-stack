import {Component, Input, OnInit} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {MetaAttribute} from '../../../../domain/meta.entity';

@Component({
  selector: 'app-text-field-control',
  templateUrl: './text-field-control.component.html',
  styleUrls: ['./text-field-control.component.css']
})
export class TextFieldControlComponent implements OnInit {

  @Input()
  formGroup: FormGroup;

  @Input()
  attribute: MetaAttribute;

  @Input()
  mode: string | null;

  constructor() { }

  ngOnInit(): void {
  }

  isReadOnly() {
    return this.mode === 'view' ? true : null;
  }

}