import {Component, Input, OnInit} from '@angular/core';
import {FormGroup} from '@angular/forms';

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
}
