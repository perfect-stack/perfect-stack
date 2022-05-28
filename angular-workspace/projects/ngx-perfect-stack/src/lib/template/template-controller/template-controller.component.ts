import {Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {Cell, SelectTwoComponentData, Template, TemplateType} from '../../domain/meta.page';
import {AttributeType, MetaAttribute, MetaEntity} from '../../domain/meta.entity';
import {MetaEntityService} from '../../meta/entity/meta-entity-service/meta-entity.service';
import {FormControl, FormGroup} from '@angular/forms';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {CellSettingsComponent, CellSettingsResult} from './cell-settings/cell-settings.component';
import {Observable} from 'rxjs';

// This file contains many Components because they have a circular dependency on the top-level component of
// TemplateControllerComponent. When Angular builds this as a library it doesn't allow this sort of circular dependency to
// exist in separate files, but is ok if all the components are in a single file. It also allows this situation if
// you are building as an application (but not a library). See the following Angular error for what this coding structure
// is solving. NG3003: One or more import cycles would need to be created to compile this component


@Component({
  selector: 'lib-template-controller',
  templateUrl: './template-controller.component.html',
  styleUrls: ['./template-controller.component.css']
})
export class TemplateControllerComponent implements OnInit { //, OnChanges {

  @Input()
  public template: Template;

  constructor() { }

  ngOnInit(): void {}
}


@Component({
  selector: 'lib-template-form-editor',
  templateUrl: './template-form-editor.component.html',
  styleUrls: ['./template-form-editor.component.css'],
})
export class TemplateFormEditor implements OnInit {

  @Input()
  public template: Template;

  metaEntityMap$: Observable<Map<string, MetaEntity>> = this.metaEntityService.metaEntityMap$;

  constructor(protected readonly metaEntityService: MetaEntityService) { }

  ngOnInit(): void {}

  getCSS(cell: Cell): string[] {
    return [
      `col-${cell.width}`
    ];
  }

  getAttribute(name: string | undefined, metaEntityMap: Map<string, MetaEntity>, metaEntityName: string): MetaAttribute | undefined {
    if(name && metaEntityMap && metaEntityName) {
      const metaEntity = metaEntityMap.get(metaEntityName)
      if(metaEntity) {
        return metaEntity.attributes.find(a => a.name === name);
      }
    }
    return undefined;
  }

  onChangeWidth(value: number, row: Cell[], cell: Cell) {
    const lastCell = row[row.length - 1];
    let lastCellWidth = Number(lastCell.width);

    const totalWidth = this.getTotalWidth(row);
    const newTotalWidth = totalWidth + value;

    const cellWidth = Number(cell.width);
    const newCellWidth = cellWidth + value;

    if(cell === lastCell) {
      if(newTotalWidth <= 12 && newCellWidth >= 1 && newCellWidth <= 12) {
        cell.width = String(newCellWidth);
      }
    }
    else {
      const lastCellChangeNeeded = newTotalWidth > 12;

      let canLastCellBeChanged = true;
      if(lastCellChangeNeeded) {
        lastCellWidth = lastCellWidth - 1;
        canLastCellBeChanged = lastCellWidth >= 1 && lastCellWidth <= 12;
      }

      const canCellBeChanged = newCellWidth >= 1 && newCellWidth <= 12;
      if(canCellBeChanged && canLastCellBeChanged) {
        cell.width = String(newCellWidth);
        if(lastCellChangeNeeded) {
          lastCell.width = String(lastCellWidth);
        }
      }
    }
  }

  getTotalWidth(row: Cell[]) {
    let totalWidth = 0;
    for(let nextCell of row) {
      totalWidth += Number(nextCell.width);
    }
    return totalWidth;
  }

  onChangeHeight($event: number, nextRow: Cell[], nextCell: Cell) {
    console.log(`onChangeHeight: ${$event}`);
    let newHeight: number = Number(nextCell.height) + $event;
    if(newHeight < 1) {
      newHeight = 1;
    }

    if(newHeight > 10) {
      newHeight = 10;
    }

    nextCell.height = String(newHeight);
  }

  onAddCell(row: Cell[]) {
    const totalWidth = this.getTotalWidth(row);
    const cellWidth = Math.min(12 - totalWidth, 4);

    const cell = new Cell();
    cell.width = String(cellWidth);
    cell.height = String(1)
    row.push(cell);
  }

  onDeleteCell(cell: Cell, row: Cell[]) {
    row.splice(row.indexOf(cell), 1);
    if(row.length == 0) {
      this.template.cells = this.template.cells.filter((r) => r.length > 0);
    }
  }

  onAddRow(number: number) {
    for(let i = 0; i < number; i++) {
      const row: Cell[] = [];
      this.onAddCell(row);
      this.template.cells.push(row);
    }
  }

  clearAllCells() {
    for(const nextRow of this.template.cells) {
      for(const nextCell of nextRow) {
        this.clearOneCell(nextCell);
      }
    }
  }

  clearOneCell(cell: Cell) {
    cell.attributeName = undefined;
  }

  getMetaEntity(metaEntityMap: Map<string, MetaEntity>, metaEntityName: string) {
    return metaEntityMap?.get(metaEntityName);
  }
}



@Component({
  selector: 'lib-cell-view',
  templateUrl: './cell-view.component.html',
  styleUrls: ['./cell-view.component.css'],
})
export class CellViewComponent implements OnInit, OnChanges {

  get attribute(): MetaAttribute | undefined {
    return this._attribute;
  }

  @Input()
  set attribute(value: MetaAttribute | undefined) {
    this._attribute = value;
    if(value && value.name) {
      this.entityForm.addControl(value.name, new FormControl(''));
    }
  }

  @Input()
  metaEntity: MetaEntity | undefined;

  @Input()
  cell: Cell;

  private _attribute: MetaAttribute | undefined;

  @Output()
  changeWidth = new EventEmitter<number>();

  @Output()
  changeHeight = new EventEmitter<number>();

  @Output()
  deleteCell = new EventEmitter<Cell>();

  mouseActive = false;

  entityForm: FormGroup = new FormGroup([] as any);

  closeResult = '';

  constructor(private modalService: NgbModal) { }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['cell']) {
      this.onCellChange(changes['cell'].currentValue);
    }
  }

  onCellChange(cell: Cell) {
    console.log(`onCellChange() attribute type = ${this.attribute?.type}`);
    // if(!cell.template) {
    //   const template = new Template();
    //   template.type = TemplateType.table;
    //   if(this.attribute) {
    //     template.metaEntityName = this.attribute.relationshipTarget;
    //   }
    //   else {
    //     console.warn('UNABLE to set template metaEntityName since attribute is unknown');
    //   }
    //   cell.template = template;
    // }
  }

  @HostListener('mouseenter')
  onMouseEnter() {
    this.mouseActive = true;
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.mouseActive = false;
  }

  getCSS(): string[] {
    return [
      `col-${this.cell.width}`
    ];
  }

  getCSSHeight(cell: Cell) {
    const height: number = cell && cell.height ? Number(cell.height) : 1;
    const cssHeight = 6 + ((height - 1) * 3) + 1;  // 1, 4
    return `${cssHeight}em`;
  }

  onChangeWidth(value: number, $event: MouseEvent) {
    this.changeWidth.emit(value);
  }

  onChangeHeight(value: number) {
    this.changeHeight.emit(value);
  }

  onDeleteCell() {
    this.deleteCell.emit(this.cell);
  }

  onClearCell() {
    delete this.cell.attributeName;
    delete this.cell.template;
    this.attribute = undefined;
    this.entityForm = new FormGroup([] as any);
  }

  isDropDisabled() {
    return this.cell.template !== undefined;
  }

  onItemDrop($event: DragEvent) {
    console.log(`onItemDrop()`, $event);
/*    const attribute: MetaAttribute = $event.dragData;
    this._attribute = attribute;
    this.cell.attributeName = attribute.name;

    if(attribute.type === AttributeType.OneToMany) {
      this.cell.template = {
        binding: '',
        templateHeading: '',
        type: TemplateType.table,
        metaEntityName: attribute.relationshipTarget,
        orderByName: 'UNKNOWN',
        orderByDir: 'ASC',
        cells: [[
          {
            width: '3',
            height: '1',
          },
          {
            width: '3',
            height: '1',
          }
        ]]
      };
    }*/
  }

  onSettings() {
    if(this.cell && this.attribute && this.metaEntity) {
      const modalRef = this.modalService.open(CellSettingsComponent, {ariaLabelledBy: 'modal-basic-title'});

      const cellSettingsComponent = modalRef.componentInstance as CellSettingsComponent;
      cellSettingsComponent.init(this.metaEntity, this.attribute, this.cell.component, this.cell.componentData);

      modalRef.closed.subscribe((result: CellSettingsResult) => {
        this.cell.component = result.componentType;
        if(result.componentType === 'SelectTwo') {
          this.cell.componentData = {
            secondaryAttributeName: result.secondaryAttributeName
          } as SelectTwoComponentData;
        }
        else {
          delete this.cell.componentData;
        }
      });
    }
  }

  onAddTemplate() {
    console.log(`onAddTemplate()`);
    this.cell.template = {
      binding: '',
      templateHeading: '',
      type: TemplateType.table,
      metaEntityName: '',
      orderByName: '',
      orderByDir: '',
      cells: [[
        {
          width: '6',
          height: '1',
        },
      ]]
    };
  }

  onDropzoneDropped($event: any) {
    console.log('onDropzoneDropped()', $event);
    const attribute: MetaAttribute = $event as MetaAttribute;
    this._attribute = attribute;
    this.cell.attributeName = attribute.name;

    if(attribute.type === AttributeType.OneToMany) {
      this.cell.template = {
        binding: '',
        templateHeading: '',
        type: TemplateType.table,
        metaEntityName: attribute.relationshipTarget,
        orderByName: 'UNKNOWN',
        orderByDir: 'ASC',
        cells: [[
          {
            width: '3',
            height: '1',
          },
          {
            width: '3',
            height: '1',
          }
        ]]
      };
    }
  }
}
