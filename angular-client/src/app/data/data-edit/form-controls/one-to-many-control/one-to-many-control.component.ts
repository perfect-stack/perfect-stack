import {Component, Input, OnInit} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {MetaAttribute} from '../../../../domain/meta.entity';
import {Cell, Template, TemplateType} from '../../../../domain/meta.page';

@Component({
  selector: 'app-one-to-many-control',
  templateUrl: './one-to-many-control.component.html',
  styleUrls: ['./one-to-many-control.component.css']
})
export class OneToManyControlComponent implements OnInit {
  get cell(): Cell {
    return this._cell;
  }

  @Input()
  set cell(value: Cell) {
    this._cell = value;
    if(!this._cell.template) {
      const template = new Template();
      template.type = TemplateType.table;
      template.metaEntityName = this.attribute.relationshipTarget;
      this._cell.template = template;
    }
  }

  @Input()
  formGroup: FormGroup;

  @Input()
  attribute: MetaAttribute;

  @Input()
  mode: string | null;

  private _cell: Cell;

  constructor() { }

  ngOnInit(): void {
  }

  isReadOnly() {
    return this.mode === 'view' ? true : null;
  }

}
