import {Component, Input, OnInit} from '@angular/core';
import {CellAttribute} from '../../../../../meta/page/meta-page-service/meta-page.service';
import {FormGroup} from '@angular/forms';
import {Cell} from '../../../../../domain/meta.page';

@Component({
  selector: 'lib-child-form-layout',
  templateUrl: './child-form-layout.component.html',
  styleUrls: ['./child-form-layout.component.css']
})
export class ChildFormLayoutComponent implements OnInit {

  @Input()
  mode: string | null;

  @Input()
  cells: CellAttribute[][];

  @Input()
  formGroup: FormGroup;

  constructor() { }

  ngOnInit(): void {
  }

  getCSS(cell: Cell): string[] {
    return [
      `col-${cell.width}`
    ];
  }

}
