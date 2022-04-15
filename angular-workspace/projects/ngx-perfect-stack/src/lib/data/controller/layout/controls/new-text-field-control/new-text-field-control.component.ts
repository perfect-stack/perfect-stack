import {Component, Input, OnInit} from '@angular/core';
import {CellAttribute} from '../../../../../meta/page/meta-page-service/meta-page.service';
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

  constructor() { }

  ngOnInit(): void {
  }

  isReadOnly() {
    return this.mode === 'view' ? true : null;
  }
}
