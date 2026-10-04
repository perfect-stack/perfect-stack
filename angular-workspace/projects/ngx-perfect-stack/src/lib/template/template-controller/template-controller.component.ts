import {ChangeDetectorRef, Component, EventEmitter, HostListener, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges} from '@angular/core';
import {Cell, Template, TemplateLocationType, TemplateType, Tool} from '../../domain/meta.page';
import {AttributeType, MetaAttribute, MetaEntity} from '../../domain/meta.entity';
import {MetaEntityService} from '../../meta/entity/meta-entity-service/meta-entity.service';
import {FormGroup, UntypedFormControl, UntypedFormGroup} from '@angular/forms';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Observable, Subscription} from 'rxjs';
import {PropertySheetService} from '../property-sheet/property-sheet.service';
import {OneToManyChoiceDialogComponent} from './one-to-many-choice-dialog/one-to-many-choice-dialog.component';
import {DragService} from '../../utils/dragdrop/drag.service';

// This file contains many Components because they have a circular dependency on the top-level component of
// TemplateControllerComponent. When Angular builds this as a library it doesn't allow this sort of circular dependency to
// exist in separate files, but is ok if all the components are in a single file. It also allows this situation if
// you are building as an application (but not a library). See the following Angular error for what this coding structure
// is solving. NG3003: One or more import cycles would need to be created to compile this component


@Component({
    selector: 'lib-template-controller',
    templateUrl: './template-controller.component.html',
    styleUrls: ['./template-controller.component.css'],
    standalone: false
})
export class TemplateControllerComponent implements OnInit, OnDestroy {

  @Input()
  public template: Template;

  isDragging = false;
  private dragSub: Subscription;

  constructor(
    protected dragService: DragService,
    protected changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.isDragging = this.dragService.isDragging;
    this.dragSub = this.dragService.dragInProgress$.subscribe((status: string) => {
      this.isDragging = status === 'started';
      this.changeDetectorRef.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.dragSub?.unsubscribe();
  }

  onToolChanged(): void {
    this.changeDetectorRef.detectChanges();
  }

  get hasBottomTools(): boolean {
    if (!this.template || !this.template.locations) return false;
    return !!(
      this.template.locations[TemplateLocationType.BottomLeft] ||
      this.template.locations[TemplateLocationType.BottomMiddle] ||
      this.template.locations[TemplateLocationType.BottomRight]
    );
  }

  get TemplateLocationType() {
    return TemplateLocationType;
  }
}


@Component({
    selector: 'lib-template-form-editor',
    templateUrl: './template-form-editor.component.html',
    styleUrls: ['./template-form-editor.component.css'],
    standalone: false
})
export class TemplateFormEditor implements OnInit {

  @Input()
  public template: Template;

  metaEntityMap$: Observable<Map<string, MetaEntity>> = this.metaEntityService.metaEntityMap$;

  constructor(protected readonly metaEntityService: MetaEntityService) { }

  ngOnInit(): void {
  }

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
    standalone: false
})
export class CellViewComponent implements OnInit, OnChanges {

  get attribute(): MetaAttribute | undefined {
    return this._attribute;
  }

  @Input()
  set attribute(value: MetaAttribute | undefined) {
    this._attribute = value;
    if (this.cell && value) {
      this.cell.attribute = value;
    }
    if(value && value.name) {
      if (!this.entityForm.contains(value.name)) {
        this.entityForm.addControl(value.name, new UntypedFormControl(''));
      }
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

  entityForm: UntypedFormGroup = new UntypedFormGroup([] as any);

  closeResult = '';

  get isEmptyCell(): boolean {
    return (
      !this.attribute &&
      !this.cell?.template &&
      !this.cell?.tool &&
      this.cell?.component !== 'MediaGallery' &&
      this.cell?.component !== 'Media'
    );
  }

  get hasContent(): boolean {
    return !this.isEmptyCell;
  }

  constructor(protected readonly modalService: NgbModal,
              protected readonly propertySheetService: PropertySheetService,
              protected readonly changeDetectorRef: ChangeDetectorRef) { }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(this.cell && this.attribute) {
      this.cell.attribute = this.attribute;
    }
    if(changes['cell']) {
      this.onCellChange(changes['cell'].currentValue);
    }
  }

  onCellChange(cell: Cell) {
    console.log(`onCellChange() attribute type = ${this.attribute?.type}`);
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
    delete this.cell.tool;
    delete this.cell.component;
    delete this.cell.dataProvider;
    delete this.cell.attribute;
    this.attribute = undefined;
    this.entityForm = new UntypedFormGroup([] as any);
    this.changeDetectorRef.detectChanges();
  }

  isDropDisabled() {
    return this.cell.template !== undefined;
  }

  onSettings() {
    if(this.cell) {
      this.propertySheetService.editWithType('Cell', this.cell, 'Cell');
    }
  }

  onAddTemplate() {
    console.log(`onAddTemplate()`);
    this.onClearCell()

    this.cell.template = {
      binding: '',
      templateHeading: '',
      type: TemplateType.table,
      metaEntityName: '',
      cells: [[
        {
          width: '6',
          height: '1',
        },
      ]],
      styles: '',
      orderByName: '',
      orderByDir: '',
      noItemsHtml: '',
      locations: {},
    };
  }

  onDropzoneDropped($event: any) {
    console.log('onDropzoneDropped()', $event);
    if(MetaAttribute.isMetaAttribute($event)) {
      this.addAttribute($event as MetaAttribute)
    }
    else if(Tool.isTool($event)) {
      this.addTool($event as Tool);
    }
    else {
      console.warn('onDropzoneDropped but supplied object is not a MetaAttribute or Tool');
    }
  }

  private addAttribute(attribute: MetaAttribute) {
    this.onClearCell();

    if(attribute.type === AttributeType.OneToMany) {
      const modalRef = this.modalService.open(OneToManyChoiceDialogComponent).closed.subscribe((controlType: string) => {
        console.log(`OneToManyChoiceDialogComponent picked: ${controlType}`);
        switch (controlType) {
          case 'Table':
            this.addTableTemplate(attribute);
            break;
          case 'Links':
            this.addLinkControl(attribute);
            break;
          case 'Media':
            this.addMediaControl(attribute);
            break;
          case 'MediaGallery':
            this.addMediaGalleryControl(attribute);
            break;
          default:
            throw new Error(`Unknown controlType of ${controlType}`);
        }
      });
    }
    else {
      this._attribute = attribute;
      this.cell.attributeName = attribute.name;
      this.cell.attribute = attribute;
      if (attribute.name && !this.entityForm.contains(attribute.name)) {
        this.entityForm.addControl(attribute.name, new UntypedFormControl(''));
      }
      this.changeDetectorRef.detectChanges();
    }
  }

  private addTableTemplate(attribute: MetaAttribute) {
    this.cell.template = {
      binding: attribute.name,
      templateHeading: '',
      type: TemplateType.table,
      metaEntityName: attribute.relationshipTarget,
      cells: [[
        {
          width: '12',
          height: '1',
          attributeName: attribute.name,
        },
      ]],
      styles: '',
      orderByName: 'UNKNOWN',
      orderByDir: 'ASC',
      noItemsHtml: '',
      locations: {},
    };
  }

  private addLinkControl(attribute: MetaAttribute) {
    this._attribute = attribute;
    this.cell.attributeName = attribute.name;
    this.cell.attribute = attribute;
    this.cell.component = 'LinkList'
  }

  private addMediaControl(attribute: MetaAttribute) {
    this._attribute = attribute;
    this.cell.attributeName = attribute.name;
    this.cell.attribute = attribute;
    this.cell.component = 'Media';
  }

  private addMediaGalleryControl(attribute: MetaAttribute) {
    this._attribute = attribute;
    this.cell.attributeName = attribute.name;
    this.cell.attribute = attribute;
    this.cell.component = 'MediaGallery';
  }

  private addTool(toolPrototype: Tool) {
    console.log('addTool', toolPrototype);
    this.onClearCell();

    this.cell.tool = Object.assign({}, toolPrototype);
    this.propertySheetService.edit(this.cell.tool.type, this.cell.tool);
    this.changeDetectorRef.detectChanges();
  }

  isShowLabel(attribute: MetaAttribute) {
    return attribute && attribute.type !== AttributeType.Boolean && this.cell.hideLabel !== true;
  }
}

@Component({
    selector: 'lib-template-header-editor',
    templateUrl: './template-header-editor.component.html',
    styleUrls: ['./template-header-editor.component.css'],
    standalone: false
})
export class TemplateHeaderEditorComponent implements OnInit{

  @Input()
  public template: Template;

  metaEntityMap$: Observable<Map<string, MetaEntity>> = this.metaEntityService.metaEntityMap$;

  constructor(protected readonly metaEntityService: MetaEntityService) { }

  ngOnInit(): void {
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
