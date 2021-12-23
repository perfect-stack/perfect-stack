import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {MetaEntityService} from '../../meta/entity/meta-entity-service/meta-entity.service';
import {Observable, switchMap} from 'rxjs';
import {MetaEntity} from '../../domain/meta.entity';

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

  public metaName: string | null = 'Person';
  public metaEntity$: Observable<MetaEntity>;

  cells: Cell[][];

  constructor(protected readonly metaEntityService: MetaEntityService) { }

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

    this.metaEntity$ = this.metaEntityService.findById(this.metaName);
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
    const cellWidth = Math.min(12 - totalWidth, 4);

    const cell = new Cell();
    cell.width = String(cellWidth);
    cell.height = String(1)
    row.push(cell);
  }

  onAddRow(number: number) {
    for(let i = 0; i < number; i++) {
      const row: Cell[] = [];
      this.onAddCell(row);
      this.cells.push(row);
    }
  }

  onDeleteCell(cell: Cell, row: Cell[]) {
    row.splice(row.indexOf(cell), 1);
    if(row.length == 0) {
      this.cells = this.cells.filter((r) => r.length > 0);
    }
  }

  onCancel() {

  }

  onSave() {

  }
}
