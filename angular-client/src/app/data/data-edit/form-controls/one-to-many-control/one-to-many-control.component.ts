import {Component, Input, OnChanges, OnInit, SimpleChange, SimpleChanges} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {MetaAttribute} from '../../../../domain/meta.entity';
import {Cell, Template, TemplateType} from '../../../../domain/meta.page';

@Component({
  selector: 'app-one-to-many-control',
  templateUrl: './one-to-many-control.component.html',
  styleUrls: ['./one-to-many-control.component.css']
})
export class OneToManyControlComponent implements OnInit, OnChanges {

  @Input()
  formGroup: FormGroup;

  @Input()
  attribute: MetaAttribute;

  @Input()
  mode: string;

  @Input()
  cell: Cell;

  constructor() { }

  ngOnInit(): void {
  }

  isReadOnly() {
    return this.mode === 'view' ? true : null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['cell']) {
      this.onCellChange(changes['cell'].currentValue);
    }

  }

  onCellChange(cell: Cell) {
    if(!cell.template) {
      const template = new Template();
      template.type = TemplateType.table;
      template.metaEntityName = this.attribute.relationshipTarget;
      cell.template = template;
    }
  }
}
