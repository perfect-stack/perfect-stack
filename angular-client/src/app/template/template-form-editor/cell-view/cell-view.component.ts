import {Component, EventEmitter, HostListener, Input, OnInit, Output} from '@angular/core';
import {DropEvent} from 'ng-drag-drop';
import {MetaAttribute} from '../../../domain/meta.entity';
import {FormControl, FormGroup} from '@angular/forms';
import {Cell} from '../../../domain/meta.page';

@Component({
  selector: 'app-cell-view',
  templateUrl: './cell-view.component.html',
  styleUrls: ['./cell-view.component.css'],
})
export class CellViewComponent implements OnInit {

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

  getCSS(): string[] {
    return [
      `col-${this.cell.width}`
    ];
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
}
