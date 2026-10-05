import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { CellAttribute } from '../../../../meta/page/meta-page-service/meta-page.service';
import { FormContext } from '../../../data-edit/form-service/form.service';

@Component({
  selector: 'lib-cell',
  templateUrl: './cell.component.html',
  styleUrls: ['./cell.component.css'],
  standalone: false
})
export class CellComponent implements OnInit {

  @Input()
  mode: string | null;

  @Input()
  cell: CellAttribute;

  @Input()
  formGroup: UntypedFormGroup;

  @Input()
  ctx: FormContext;

  constructor() { }

  ngOnInit(): void {
  }
}
