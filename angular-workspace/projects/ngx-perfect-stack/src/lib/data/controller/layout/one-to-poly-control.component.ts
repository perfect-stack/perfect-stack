import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { CellAttribute } from '../../../meta/page/meta-page-service/meta-page.service';
import { FormContext } from '../../data-edit/form-service/form.service';

@Component({
  selector: 'lib-one-to-poly-control',
  templateUrl: './one-to-poly-control.component.html',
  styleUrls: ['./one-to-poly-control.component.css'],
  standalone: false
})
export class OneToPolyControlComponent implements OnInit {

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
  }
}
