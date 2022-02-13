import {Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {DropEvent} from 'ng-drag-drop';
import {MetaAttribute} from '../../../domain/meta.entity';
import {FormControl, FormGroup} from '@angular/forms';
import {Cell, ComponentType, Template, TemplateType} from '../../../domain/meta.page';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-cell-view',
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
    if(!cell.template) {
      const template = new Template();
      template.type = TemplateType.table;
      if(this.attribute) {
        template.metaEntityName = this.attribute.relationshipTarget;
      }
      else {
        console.warn('UNABLE to set template metaEntityName since attribute is unknown');
      }
      cell.template = template;
    }
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
    this.changeWidth.next(value);
  }

  onChangeHeight(value: number) {
    this.changeHeight.next(value);
  }

  onDeleteCell() {
    this.deleteCell.next(this.cell);
  }

  onClearCell() {
    this.cell.attributeName = undefined;
    this.attribute = undefined;
    this.entityForm = new FormGroup([] as any);
  }

  onItemDrop($event: DropEvent) {
    const attribute = $event.dragData;
    this._attribute = attribute;
    this.cell.attributeName = attribute.name;
  }

  onSettings(settingsTemplate: any) {
    this.modalService.open(settingsTemplate, {ariaLabelledBy: 'modal-basic-title'}).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.closeResult = `Dismissed`;
    });
  }

  getComponentTypeOptions() {
    return Object.keys(ComponentType);
  }

  onComponentTypeChange(value: any) {
    console.log(`onComponentTypeChange = ${value}`);
  }
}
