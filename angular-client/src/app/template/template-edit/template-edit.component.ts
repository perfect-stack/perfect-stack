import {Component, OnInit} from '@angular/core';
import {MetaEntityService} from '../../meta/entity/meta-entity-service/meta-entity.service';
import {map, Observable} from 'rxjs';
import {MetaAttribute, MetaEntity} from '../../domain/meta.entity';
import {Cell, Template} from '../../domain/meta.page';

@Component({
  selector: 'app-template-edit',
  templateUrl: './template-edit.component.html',
  styleUrls: ['./template-edit.component.css'],
})
export class TemplateEditComponent implements OnInit {

  public metaName: string | null = 'Person';
  public metaEntity$: Observable<MetaEntity>;
  public template: Template;

  constructor(protected readonly metaEntityService: MetaEntityService) { }

  ngOnInit(): void {
    this.metaEntity$ = this.metaEntityService.findById(this.metaName).pipe(map(metaEntity => {
      if(!metaEntity.templates) {
        metaEntity.templates = {};
      }

      if(!metaEntity.templates['view-edit']) {
        const template = new Template();
        template.name = 'view-edit'
        metaEntity.templates['view-edit'] = template;
      }

      return metaEntity;
    }));

    this.metaEntity$.subscribe(metaEntity => {
      if(metaEntity.templates && metaEntity.templates['view-edit']) {
        this.template = metaEntity.templates['view-edit'] as Template;
      }
    });
  }

  getCSS(cell: Cell): string[] {
    return [
      `col-${cell.width}`
    ];
  }

  getAttribute(name: string | undefined, metaEntity: MetaEntity): MetaAttribute | undefined {
    return name ? metaEntity.attributes.find(a => name === a.name) : undefined;
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
      this.template.cells.push(row);
    }
  }

  onDeleteCell(cell: Cell, row: Cell[]) {
    row.splice(row.indexOf(cell), 1);
    if(row.length == 0) {
      this.template.cells = this.template.cells.filter((r) => r.length > 0);
    }
  }

  onCancel() {

  }

  onSave(metaEntity: MetaEntity) {
    console.log(`onSave():`, this.template);
    if(this.template && this.template.name) {
      metaEntity.templates[this.template.name] = this.template;
      this.metaEntityService.update(metaEntity).subscribe((result) => {
        console.log('Meta entity is saved');
      });
    }
    else {
      console.log('Invalid template:', this.template);
    }
  }

}
