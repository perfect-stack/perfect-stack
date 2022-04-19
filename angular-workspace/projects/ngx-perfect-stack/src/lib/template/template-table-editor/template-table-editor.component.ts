import {Component, HostListener, Input, OnInit} from '@angular/core';
import {Cell, Template} from '../../domain/meta.page';
import {AttributeType, MetaAttribute, MetaEntity} from '../../domain/meta.entity';
import {DropEvent} from 'ng-drag-drop';

@Component({
  selector: 'app-template-table-editor',
  templateUrl: './template-table-editor.component.html',
  styleUrls: ['./template-table-editor.component.css']
})
export class TemplateTableEditorComponent implements OnInit {

  @Input()
  template: Template;

  @Input()
  public metaEntity: MetaEntity | undefined;

  mouseActive = false;

  constructor() { }

  ngOnInit(): void {
  }

  @HostListener('mouseenter')
  onMouseEnter() {
    this.mouseActive = true;
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.mouseActive = false;
  }

  getAttribute(cell: Cell) {
    if(this.metaEntity && this.metaEntity.attributes) {
      return this.metaEntity?.attributes.find(a => a.name == cell.attributeName);
    }
    else {
      return undefined;
    }
  }

  getAttributeLabel(cell: Cell) {
    const attribute = this.getAttribute(cell);
    return attribute ? attribute.label : '';
  }

  onDropIntoCell($event: DropEvent, cell: Cell) {
    console.log(`onDropIntoCell(): ${JSON.stringify($event.dragData)}`);
    const attribute = $event.dragData as MetaAttribute;
    cell.attributeName = attribute.name;
  }

  onDropAddCell($event: DropEvent) {

    const cell = new Cell();
    cell.width = '1';
    cell.height = '1';
    const firstRow = this.template.cells[0];
    firstRow.push(cell);

    const attribute = $event.dragData as MetaAttribute;
    cell.attributeName = attribute.name;
  }

  getDataTypePlaceholder(cell: Cell) {
    const attribute = this.getAttribute(cell);
    if(attribute) {
      switch (attribute.type) {
        case AttributeType.Date:
          return 'yyyy-mm-dd';
        case AttributeType.Text:
          return 'Abc...';
        case AttributeType.Number:
        case AttributeType.Integer:
          return '123.0';
        case AttributeType.ManyToOne:
          return 'Search...';
        default:
          return `UNKNOWN: data type ${attribute.type}`;
      }
    }
    else {
      return '';
    }
  }

  onDeleteCell(cell: Cell) {
    console.log('delete cell');
    const row = this.template.cells[0];
    row.splice(row.indexOf(cell), 1);
  }

  onClearCell(cell: Cell) {
    console.log('clear cell');
    cell.attributeName = undefined;
    if(cell.component) {
      cell.component = undefined;
    }
  }
}
