import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { CellAttribute } from '../../../../../meta/page/meta-page-service/meta-page.service';
import { FormContext } from '../../../../data-edit/form-service/form.service';

@Component({
  selector: 'lib-one-to-many-control',
  templateUrl: './one-to-many-control.component.html',
  styleUrls: ['./one-to-many-control.component.css'],
  standalone: false
})
export class OneToManyControlComponent implements OnInit {

  @Input()
  mode: string | null;

  @Input()
  ctx: FormContext;

  @Input()
  cell: CellAttribute;

  @Input()
  formGroup: UntypedFormGroup;

  constructor() { }

  ngOnInit(): void {
    console.log('OneToManyControlComponent - init');
    console.log(' - formGroup:', this.formGroup);
  }
}
