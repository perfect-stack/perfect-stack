import {Component, Input, OnInit} from '@angular/core';
import {Cell} from '../../../domain/meta.page';
import {FormGroup} from '@angular/forms';
import {CellAttribute} from '../../../meta/page/meta-page-service/meta-page.service';

@Component({
  selector: 'app-form-layout',
  templateUrl: './form-layout.component.html',
  styleUrls: ['./form-layout.component.css']
})
export class FormLayoutComponent implements OnInit {

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
