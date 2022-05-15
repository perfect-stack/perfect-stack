import {Component, Inject, Input, OnInit, ViewEncapsulation} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {NgbInputDatepicker} from '@ng-bootstrap/ng-bootstrap';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../../../../../ngx-perfect-stack-config';

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

  constructor(@Inject(STACK_CONFIG) protected readonly stackConfig: NgxPerfectStackConfig) { }

  ngOnInit(): void {
  }

  get isReadOnly() {
    return this.mode === 'view' ? true : null;
  }

  get placeholder() {
    return this.isReadOnly ? '-' : this.stackConfig.dateFormat.toLowerCase();
  }

  toggle(datePicker: NgbInputDatepicker) {
    if(!this.isReadOnly) {
      datePicker.toggle();
    }
  }
}
