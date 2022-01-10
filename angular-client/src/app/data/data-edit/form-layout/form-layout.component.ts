import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {CellAttribute} from '../../../meta/page/meta-page-service/meta-page.service';
import {FormGroup} from '@angular/forms';
import {Cell} from '../../../domain/meta.page';

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
