import {Component, HostListener, Input, OnInit} from '@angular/core';
import {Cell, Template, Tool} from '../../../domain/meta.page';
import {AttributeType, MetaAttribute, MetaEntity} from '../../../domain/meta.entity';
import {Observable} from 'rxjs';
import {MetaEntityService} from '../../../meta/entity/meta-entity-service/meta-entity.service';
import {PropertySheetService} from '../../property-sheet/property-sheet.service';

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

  constructor(protected readonly metaEntityService: MetaEntityService,
              protected readonly propertySheetService: PropertySheetService) { }

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

  onDropAddCell($event: any) {

    console.log('onDropAddCell:', $event)
    const cell = new Cell();
    cell.width = '1';
    cell.height = '1';
    const firstRow = this.template.cells[0];
    firstRow.push(cell);

    this.onDropIntoTableHeader($event, cell);
  }

  onDropIntoTableHeader($event: any, cell: Cell) {
    console.log(`onDropIntoCell():`, $event);
    if(MetaAttribute.isMetaAttribute($event)) {
      console.log(`onDropIntoCell(): isMetaAttribute()`);
      this.addAttribute($event as MetaAttribute, cell)
    }
    else if(Tool.isTool($event)) {
      console.log(`onDropIntoCell(): isTool()`);
      this.addTool($event as Tool, cell);
    }
    else {
      console.warn('onDropzoneDropped but supplied object is not a MetaAttribute or Tool');
    }
  }

  onDropIntoTableCell($event: any, nextCell: Cell) {

  }

  addAttribute(attribute: MetaAttribute, cell: Cell) {
    this.onClearCell(cell);
    cell.attributeName = attribute.name;
  }

  addTool(toolPrototype: Tool, cell: Cell) {
    this.onClearCell(cell);
    cell.tool = Object.assign({}, toolPrototype);
    this.propertySheetService.edit(cell.tool.type, cell.tool);
  }

  getDataTypePlaceholder(cell: Cell, metaEntityMap: Map<string, MetaEntity>) {
    if(cell.attributeName) {
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
          case AttributeType.Enumeration:
            return 'Enumeration';
          default:
            return `UNKNOWN: data type ${attribute.type}`;
        }
      }
      else {
        return '';
      }
    }
    else if(cell.tool) {
      return cell.tool.type;
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

  onCellClicked(cell: Cell) {
    if(cell.tool) {
      this.propertySheetService.edit(cell.tool.type, cell.tool);
    }
  }

  onSettings(cell: Cell) {
    this.propertySheetService.editWithType('Cell', cell, 'Cell');
  }
}
