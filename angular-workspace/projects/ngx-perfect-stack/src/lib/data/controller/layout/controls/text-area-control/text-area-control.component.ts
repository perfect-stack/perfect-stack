import {Component, Input, OnInit, ViewEncapsulation} from '@angular/core';
import {UntypedFormGroup} from '@angular/forms';
import {MetaAttribute} from '../../../../../domain/meta.entity';
import {Cell} from '../../../../../domain/meta.page';

@Component({
    selector: 'app-text-area-control',
    templateUrl: './text-area-control.component.html',
    styleUrls: ['./text-area-control.component.css'],
    encapsulation: ViewEncapsulation.None,
    standalone: false
})
export class TextAreaControlComponent implements OnInit {

  @Input()
  mode: string | null;

  @Input()
  formGroup: UntypedFormGroup;

  @Input()
  attribute: MetaAttribute;

  @Input()
  cell: Cell;

  @Input()
  idSuffix: string;

  constructor() { }

  ngOnInit(): void {
  }

  isReadOnly() {
    return this.mode === 'view' ? true : null;
  }

  get componentId() : string {
    return this.idSuffix && this.attribute ? `${this.attribute.name}-${this.idSuffix}` : `${this.attribute.name}`;
  }

  getCSSHeight(cell: Cell) {
    const height: number = cell && cell.height ? Number(cell.height) : 1;
    const cssHeight = 6 + ((height - 1) * 3) + 1;  // 1, 4
    return `${cssHeight}em`;
  }
}
