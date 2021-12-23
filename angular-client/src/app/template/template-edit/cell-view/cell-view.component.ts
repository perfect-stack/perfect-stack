import {Component, EventEmitter, HostListener, Input, OnInit, Output} from '@angular/core';
import {DropEvent} from 'ng-drag-drop';
import {Cell, MetaAttribute} from '../../../domain/meta.entity';
import {FormGroup} from '@angular/forms';

@Component({
  selector: 'app-cell-view',
  templateUrl: './cell-view.component.html',
  styleUrls: ['./cell-view.component.css'],
})
export class CellViewComponent implements OnInit {

  @Input()
  cell: Cell;

  @Input()
  attribute: MetaAttribute | undefined;

  @Output()
  changeWidth = new EventEmitter<number>();

  @Output()
  changeHeight = new EventEmitter<number>();

  @Output()
  deleteCell = new EventEmitter<Cell>();

  @Output()
  clearCell = new EventEmitter<Cell>();

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
    // const width = Number(this.cell.width) + value;
    // this.cell.width = String(width);
    $event.preventDefault();
    this.changeWidth.next(value);
  }

  onChangeHeight(value: number) {
    this.changeHeight.next(value);
  }

  onDeleteCell() {
    this.deleteCell.next(this.cell);
  }

  onClearCell() {
    this.clearCell.next(this.cell);
  }

  onItemDrop($event: DropEvent) {
    const attribute = $event.dragData;
    this.attribute = attribute;
    this.cell.attributeName = attribute.name;
  }
}
