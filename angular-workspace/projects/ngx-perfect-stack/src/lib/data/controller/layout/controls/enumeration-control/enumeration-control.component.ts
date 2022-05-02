import {Component, Input, OnInit} from '@angular/core';
import {CellAttribute} from '../../../../../meta/page/meta-page-service/meta-page.service';
import {FormGroup} from '@angular/forms';
import {MetaAttribute} from '../../../../../domain/meta.entity';

@Component({
  selector: 'lib-enumeration-control',
  templateUrl: './enumeration-control.component.html',
  styleUrls: ['./enumeration-control.component.css']
})
export class EnumerationControlComponent implements OnInit {

  @Input()
  mode: string | null;

  @Input()
  cell: CellAttribute;

  @Input()
  attribute: MetaAttribute;

  @Input()
  formGroup: FormGroup;

  options: string[];

  constructor() { }

  ngOnInit(): void {
    if(this.attribute && this.attribute.enumeration) {
      this.options = this.attribute.enumeration;
    }
    else {
      throw new Error(`No options supplied for attribute ${this.attribute?.name} of type Enumeration`);
    }
  }

  isReadOnly() {
    return this.mode === 'view';
  }

  getCSSClass() {
    return this.isReadOnly() ? 'form-control': 'form-select';
  }

}
