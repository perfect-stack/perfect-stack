import {Component, Input, OnInit, ViewEncapsulation} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {IAngularMyDpOptions} from 'angular-mydatepicker';

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

  myOptions: IAngularMyDpOptions = {
    dateRange: false,
    dateFormat: 'yyyy-mm-dd',
    
    // other options...
  };

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
