import {Component, Input, OnInit} from '@angular/core';
import {FormGroup} from '@angular/forms';

@Component({
  selector: 'lib-new-text-field-control',
  templateUrl: './new-text-field-control.component.html',
  styleUrls: ['./new-text-field-control.component.css']
})
export class NewTextFieldControlComponent implements OnInit {

  @Input()
  mode: string | null;

  @Input()
  name: string;

  @Input()
  formGroup: FormGroup;

  myReadOnly: boolean;

  constructor() { }

  ngOnInit(): void {
    this.myReadOnly = this.mode === 'view';
  }

  isReadOnly() {
    return this.mode === 'view' ? true : false;
  }
}
