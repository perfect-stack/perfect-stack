import {Component, OnInit, ViewEncapsulation} from '@angular/core';

export class Cell {
  width: string;
  height: string;
}

@Component({
  selector: 'app-template-edit',
  templateUrl: './template-edit.component.html',
  styleUrls: ['./template-edit.component.css'],
  //encapsulation: ViewEncapsulation.None
})
export class TemplateEditComponent implements OnInit {

  cells: Cell[][];

  constructor() { }

  ngOnInit(): void {
    this.cells = [
      [
        { width: '3', height: '1'},
        { width: '3', height: '1'},
        { width: '3', height: '1'},
        { width: '3', height: '1'},
      ],
      [
        { width: '6', height: '1'},
        { width: '6', height: '1'},
      ]
    ]
  }

  items: any[] = [
    {name: "Apple", type: "fruit"},
    {name: "Carrot", type: "vegetable"},
    {name: "Orange", type: "fruit"}
  ];

  droppedItems: any[] = [];

    onItemDrop(e: any) {
    // Get the dropped data here
    this.droppedItems.push(e.dragData);
  }

  getCSS(cell: Cell): string[] {
    return [
      `col-${cell.width}`
    ];
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

  onAddCell(row: Cell[]) {
    const totalWidth = this.getTotalWidth(row);
    const cellWidth = 12 - totalWidth;
    const cell = new Cell();
    cell.width = String(cellWidth);
    cell.height = String(1)
    row.push(cell);
  }
}
