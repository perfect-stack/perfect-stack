import {Component, Input, OnInit} from '@angular/core';
import {UntypedFormGroup} from '@angular/forms';
import {MetaAttribute} from '../../../../../domain/meta.entity';
import {CellAttribute} from '../../../../../meta/page/meta-page-service/meta-page.service';

@Component({
    selector: 'lib-boolean-check-box-control',
    templateUrl: './boolean-check-box-control.component.html',
    styleUrls: ['./boolean-check-box-control.component.css'],
    standalone: false
})
export class BooleanCheckBoxControlComponent implements OnInit {

  @Input()
  mode: string;

  @Input()
  formGroup: UntypedFormGroup;

  @Input()
  attribute: MetaAttribute;

  @Input()
  cell?: CellAttribute;

  @Input()
  hideLabel?: boolean;

  constructor() { }

  ngOnInit(): void {
  }

  get isShowLabel(): boolean {
    if (this.hideLabel !== undefined) {
      return !this.hideLabel;
    }
    if (this.cell?.hideLabel !== undefined) {
      return !this.cell.hideLabel;
    }
    return true;
  }

  getDisplayValue() {
    const value = this.formGroup?.controls?.[this.attribute.name]?.value;
    return value ? 'Yes' : 'No';
  }
}
