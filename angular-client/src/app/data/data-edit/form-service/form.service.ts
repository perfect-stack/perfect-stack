import { Injectable } from '@angular/core';
import {CellAttribute, MetaPageService} from '../../../meta/page/meta-page-service/meta-page.service';
import {MetaEntityService} from '../../../meta/entity/meta-entity-service/meta-entity.service';
import {DataService} from '../../data-service/data.service';
import {Entity} from '../../../domain/entity';
import {Cell, MetaPage, Template} from '../../../domain/meta.page';
import {AbstractControl, FormControl, FormGroup} from '@angular/forms';
import {forkJoin, of, switchMap} from 'rxjs';
import {MetaEntity} from '../../../domain/meta.entity';


export class FormContext {
  metaPage: MetaPage;
  metaEntity: MetaEntity;
  entity: Entity;
  entityForm: FormGroup;
  cells: CellAttribute[][];
}

@Injectable({
  providedIn: 'root'
})
export class FormService {

  constructor(protected readonly metaPageService: MetaPageService,
              protected readonly metaEntityService: MetaEntityService,
              protected readonly dataService: DataService) { }

  loadFormContext(metaName: string, mode: string, id: string) {
    const metaPageName = `${metaName}.${mode}`;
    const obs = [
      this.metaPageService.findById(metaPageName),
      this.metaEntityService.findById(metaName),
      this.dataService.findById(metaName, id),
    ];

    return forkJoin(obs).pipe(switchMap(([metaPage, metaEntity, entity]) => {
      const ctx = new FormContext();
      ctx.metaPage = metaPage as MetaPage;
      ctx.metaEntity = metaEntity as MetaEntity;
      ctx.entity = entity as Entity;

      const template = ctx.metaPage.templates[0];
      ctx.entityForm = this.createForm(template);
      ctx.cells = this.toCellAttributeArray(template, ctx.metaEntity);

      ctx.entityForm.patchValue(ctx.entity);

      return of(ctx);
    }));
  }

  public toCellAttributeArray(template: Template, metaEntity: MetaEntity) {
    const cells: CellAttribute[][] = [];
    if(template && template.cells) {
      for(const nextRow of template.cells) {
        const row = []
        for(const nextCell of nextRow) {
          row.push(this.toCellAttribute(nextCell, metaEntity));
        }
        cells.push(row);
      }
    }

    return cells;
  }

  private toCellAttribute(cell: Cell, metaEntity: MetaEntity) {

    const cellAttribute: CellAttribute = {
      ...cell,
    }

    const attribute = metaEntity.attributes.find(a => cell.attributeName == a.name);
    if(attribute) {
      cellAttribute.attribute = attribute;
    }

    return cellAttribute;
  }


  createForm(template: Template) {
    const controls: {
      [key: string]: AbstractControl;
    } = {};

    // loop through cells and add FormControls for Cell attributes
    for(const nextRow of template.cells) {
      for(const nextCell of nextRow) {
        if(nextCell.attributeName) {
          controls[nextCell.attributeName] = new FormControl('');
        }
      }
    }

    return new FormGroup(controls);
  }

}
