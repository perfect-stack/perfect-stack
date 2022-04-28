import {Component, Input, OnInit, ViewEncapsulation} from '@angular/core';
import {FormGroup} from '@angular/forms';

@Component({
  selector: 'app-date-picker-control',
  templateUrl: './date-picker-control.component.html',
  styleUrls: ['./date-picker-control.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class DatePickerControlComponent implements OnInit {

  @Input()
  formGroup: FormGroup;

  @Input()
  name: string;

  @Input()
  mode: string | null;

  constructor() { }

  ngOnInit(): void {
  }

  get isReadOnly() {
    return this.mode === 'view' ? true : null;
  }

  get placeholder() {
    return this.isReadOnly ? '-' : 'yyy-mm-dd';
  }
}
