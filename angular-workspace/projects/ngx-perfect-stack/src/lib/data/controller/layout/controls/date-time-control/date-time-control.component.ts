import {Component, Input, OnInit} from '@angular/core';
import {FormGroup} from '@angular/forms';

@Component({
  selector: 'lib-date-time-control',
  templateUrl: './date-time-control.component.html',
  styleUrls: ['./date-time-control.component.css']
})
export class DateTimeControlComponent implements OnInit {

  @Input()
  mode: string | null;

  @Input()
  formGroup: FormGroup;

  @Input()
  name: string;

  constructor() { }

  ngOnInit(): void {
  }

}
