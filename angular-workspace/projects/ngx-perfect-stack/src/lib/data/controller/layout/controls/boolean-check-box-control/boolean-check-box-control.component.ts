import {Component, Input, OnInit} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {MetaAttribute} from '../../../../../domain/meta.entity';

@Component({
  selector: 'lib-boolean-check-box-control',
  templateUrl: './boolean-check-box-control.component.html',
  styleUrls: ['./boolean-check-box-control.component.css']
})
export class BooleanCheckBoxControlComponent implements OnInit {

  @Input()
  mode: string;

  @Input()
  formGroup: FormGroup;

  @Input()
  attribute: MetaAttribute;

  constructor() { }

  ngOnInit(): void {
  }

}
