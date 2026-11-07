import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {UntypedFormControl, UntypedFormGroup} from '@angular/forms';
import {MetaAttribute} from '../../../../../domain/meta.entity';
import {CellAttribute} from '../../../../../meta/page/meta-page-service/meta-page.service';

@Component({
    selector: 'lib-boolean-check-box-control',
    templateUrl: './boolean-check-box-control.component.html',
    styleUrls: ['./boolean-check-box-control.component.css'],
    standalone: false
})
export class BooleanCheckBoxControlComponent implements OnInit, OnChanges {

  @Input()
  mode: string;

  @Input()
  formGroup: UntypedFormGroup = new UntypedFormGroup({});

  @Input()
  attribute: MetaAttribute;

  @Input()
  cell?: CellAttribute;

  @Input()
  hideLabel?: boolean;

  constructor() { }

  ngOnInit(): void {
    this.ensureControl();
  }

  ngOnChanges(): void {
    this.ensureControl();
  }

  private ensureControl(): void {
    if (this.formGroup && this.attribute?.name && !this.formGroup.contains(this.attribute.name)) {
      this.formGroup.addControl(this.attribute.name, new UntypedFormControl(false));
    }
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
