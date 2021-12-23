import {Component, EventEmitter, HostListener, Input, OnInit, Output} from '@angular/core';
import {Cell} from '../template-edit.component';

@Component({
  selector: 'app-cell-view',
  templateUrl: './cell-view.component.html',
  styleUrls: ['./cell-view.component.css'],
})
export class CellViewComponent implements OnInit {

  @Input()
  cell: Cell;

  @Output()
  changeWidth = new EventEmitter<number>();

  @Output()
  changeHeight = new EventEmitter<number>();

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

}
