import {Component, HostListener, Input, OnInit} from '@angular/core';
import {Cell, Template} from '../../../domain/meta.page';
import {AttributeType, MetaAttribute, MetaEntity} from '../../../domain/meta.entity';
import {Observable} from 'rxjs';
import {MetaEntityService} from '../../../meta/entity/meta-entity-service/meta-entity.service';

@Component({
  selector: 'lib-template-table-editor',
  templateUrl: './template-table-editor.component.html',
  styleUrls: ['./template-table-editor.component.css']
})
export class TemplateTableEditorComponent implements OnInit {

  @Input()
  template: Template;

  metaEntityMap$: Observable<Map<string, MetaEntity>> = this.metaEntityService.metaEntityMap$;

  mouseActive = false;

  constructor(protected readonly metaEntityService: MetaEntityService) { }

  ngOnInit(): void {}

  @HostListener('mouseenter')
  onMouseEnter() {
    this.mouseActive = true;
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.mouseActive = false;
  }

  getMetaEntity(metaEntityMap: Map<string, MetaEntity>, metaEntityName: string): MetaEntity | undefined {
    return metaEntityMap?.get(metaEntityName);
  }

  getAttribute(cell: Cell, metaEntityMap: Map<string, MetaEntity>) {
    const metaEntity = this.getMetaEntity(metaEntityMap, this.template.metaEntityName);
    if(metaEntity && metaEntity.attributes) {
      return metaEntity.attributes.find(a => a.name == cell.attributeName);
    }
    return undefined;
  }

  getAttributeLabel(cell: Cell, metaEntityMap: Map<string, MetaEntity>) {
    const attribute = this.getAttribute(cell, metaEntityMap);
    return attribute ? attribute.label : '';
  }

  onDropIntoCell($event: any, cell: Cell) {
    console.log(`onDropIntoCell():`, $event);
    const attribute = $event as MetaAttribute;
    cell.attributeName = attribute.name;
  }

  onDropAddCell($event: any) {

    console.log('onDropAddCell:', $event)
    const cell = new Cell();
    cell.width = '1';
    cell.height = '1';
    const firstRow = this.template.cells[0];
    firstRow.push(cell);

    const attribute = $event as MetaAttribute;
    cell.attributeName = attribute.name;
  }

  getDataTypePlaceholder(cell: Cell, metaEntityMap: Map<string, MetaEntity>) {
    const attribute = this.getAttribute(cell, metaEntityMap);
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
