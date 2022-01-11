import { Injectable } from '@angular/core';
import {CellAttribute, MetaPageService} from '../../../meta/page/meta-page-service/meta-page.service';
import {MetaEntityService} from '../../../meta/entity/meta-entity-service/meta-entity.service';
import {DataService} from '../../data-service/data.service';
import {Entity} from '../../../domain/entity';
import {Cell, MetaPage, Template} from '../../../domain/meta.page';
import {AbstractControl, FormControl, FormGroup} from '@angular/forms';
import {of, switchMap} from 'rxjs';
import {MetaAttribute, MetaEntity} from '../../../domain/meta.entity';


export class FormContext {
  metaPage: MetaPage;
  metaEntity: MetaEntity;
  entity: Entity;
  entityForm: FormGroup;
  cells: CellAttribute[][];
}

export class FormControlWithAttribute extends FormControl {
  attribute: MetaAttribute;
}

@Injectable({
  providedIn: 'root'
})
export class FormService {

  constructor(protected readonly metaPageService: MetaPageService,
              protected readonly metaEntityService: MetaEntityService,
              protected readonly dataService: DataService) { }

  loadFormContext(metaName: string, mode: string, id: string | null) {
    const metaPageName = `${metaName}.${mode}`;
    const ctx = new FormContext();
    return this.metaPageService.findById(metaPageName).pipe(switchMap((metaPage) => {
      ctx.metaPage = metaPage as MetaPage;

      const template = ctx.metaPage.templates[0];
      const metaEntityName = template.metaEntityName

      return this.metaEntityService.findById(metaEntityName).pipe(switchMap( (metaEntity) => {
        ctx.metaEntity = metaEntity as MetaEntity;
        ctx.cells = this.toCellAttributeArray(template, ctx.metaEntity);
        ctx.entityForm = this.createForm(template, ctx.metaEntity);

        if(id) {
          return this.dataService.findById(ctx.metaEntity.name, id).pipe(switchMap((entity) => {
            ctx.entity = entity as Entity;
            ctx.entityForm.patchValue(ctx.entity);
            return of(ctx);
          }));
        }
        else {
          return of(ctx);
        }
      }));
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


  createForm(template: Template, metaEntity: MetaEntity) {
    const controls: {
      [key: string]: AbstractControl;
    } = {};

    // loop through cells and add FormControls for Cell attributes
    for(const nextRow of template.cells) {
      for(const nextCell of nextRow) {
        if(nextCell.attributeName) {

          const attribute = metaEntity.attributes.find(a => nextCell.attributeName == a.name);
          if(attribute) {

            const formControl = new FormControlWithAttribute('');
            formControl.attribute = attribute;
            controls[nextCell.attributeName] = formControl;
          }
        }
      }
    }

    return new FormGroup(controls);
  }

}
