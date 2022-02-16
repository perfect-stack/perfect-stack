import {Component, Input, OnInit, ViewEncapsulation} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {MetaAttribute} from '../../../../domain/meta.entity';
import {Cell} from '../../../../domain/meta.page';

@Component({
  selector: 'app-text-area-control',
  templateUrl: './text-area-control.component.html',
  styleUrls: ['./text-area-control.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class TextAreaControlComponent implements OnInit {

  @Input()
  formGroup: FormGroup;

  @Input()
  attribute: MetaAttribute;

  @Input()
  mode: string | null;

  @Input()
  cell: Cell;

  constructor() { }

  ngOnInit(): void {
  }

  isReadOnly() {
    return this.mode === 'view' ? true : null;
  }

  getCSSHeight(cell: Cell) {
    const height: number = cell && cell.height ? Number(cell.height) : 1;
    const cssHeight = 6 + ((height - 1) * 3) + 1;  // 1, 4
    return `${cssHeight}em`;
  }
}
