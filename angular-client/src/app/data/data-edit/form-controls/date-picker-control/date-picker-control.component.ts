import {Component, Input, OnInit} from '@angular/core';
import {MetaAttribute} from '../../../../domain/meta.entity';
import {FormGroup} from '@angular/forms';

@Component({
  selector: 'app-date-picker-control',
  templateUrl: './date-picker-control.component.html',
  styleUrls: ['./date-picker-control.component.css']
})
export class DatePickerControlComponent implements OnInit {

  @Input()
  formGroup: FormGroup;

  @Input()
  attribute: MetaAttribute;

  constructor() { }

  ngOnInit(): void {
  }

}
