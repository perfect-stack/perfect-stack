import {Injectable} from '@angular/core';
import {CellAttribute, MetaPageService} from '../../../meta/page/meta-page-service/meta-page.service';
import {MetaEntityService} from '../../../meta/entity/meta-entity-service/meta-entity.service';
import {DataService} from '../../data-service/data.service';
import {Entity} from '../../../domain/entity';
import {Cell, MetaPage, Template} from '../../../domain/meta.page';
import {AbstractControl, FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {of, switchMap} from 'rxjs';
import {AttributeType, MetaAttribute, MetaEntity, VisibilityType} from '../../../domain/meta.entity';


export class FormContext {
  metaName: string;
  mode: string;
  id: string | null;
  metaPage: MetaPage;
  metaEntity: MetaEntity;
  entity: Entity;
  entityForm: FormGroup;
  cells: CellAttribute[][];
}

export class FormControlWithAttribute extends FormControl {
  attribute: MetaAttribute;
}

export class FormArrayWithAttribute extends FormArray {
  attribute: MetaAttribute;
}

@Injectable({
  providedIn: 'root'
})
export class FormService {

  constructor(protected readonly metaPageService: MetaPageService,
              protected readonly metaEntityService: MetaEntityService,
              protected readonly dataService: DataService) {
  }

  loadFormContext(metaName: string, mode: string, id: string | null) {

    const pageKey = mode === 'view' || mode === 'edit' ? 'view_edit' : mode;

    const metaPageName = `${metaName}.${pageKey}`;
    const ctx = new FormContext();
    ctx.metaName = metaName;
    ctx.mode = mode;
    ctx.id = id;

    return this.metaPageService.findById(metaPageName).pipe(switchMap((metaPage) => {
      ctx.metaPage = metaPage as MetaPage;

      const template = ctx.metaPage.templates[0];
      const metaEntityName = template.metaEntityName

      return this.metaEntityService.findAll().pipe(switchMap((metaEntityList) => {
        const me = metaEntityList.find((m) => m.name === metaEntityName);
        if (!me) {
          throw new Error(`Unable to find MetaEntity for ${metaName}`);
        }
        ctx.metaEntity = me;
        ctx.cells = this.toCellAttributeArray(template, ctx.metaEntity);

        if (id) {
          return this.dataService.findById(ctx.metaEntity.name, id).pipe(switchMap((entity) => {
            ctx.entity = entity as Entity;
            ctx.entityForm = this.createFormGroup(mode, template, metaEntityList, ctx.entity);
            ctx.entityForm.patchValue(ctx.entity);
            return of(ctx);
          }));
        } else {
          ctx.entityForm = this.createFormGroup(mode, template, metaEntityList, null);
          return of(ctx);
        }
      }));
    }));
  }

  public toCellAttributeArray(template: Template, metaEntity: MetaEntity) {
    const cells: CellAttribute[][] = [];
    if (template && template.cells) {
      for (const nextRow of template.cells) {
        const row = []
        for (const nextCell of nextRow) {
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
    if (attribute) {
      cellAttribute.attribute = attribute;
    }

    return cellAttribute;
  }


  createFormGroup(mode: string, template: Template, metaEntityList: MetaEntity[], entity: Entity | null) {
    const controls: {
      [key: string]: AbstractControl;
    } = {};

    const templateMetaEntity = metaEntityList.find(m => m.name === template.metaEntityName);
    if (!templateMetaEntity) {
      throw new Error(`Unable to find template MetaEntity of ${template.metaEntityName}`)
    }

    // loop through cells and add FormControls for Cell attributes
    for (const nextAttribute of templateMetaEntity.attributes) {
      let formControl: any;
      if (nextAttribute.type === AttributeType.OneToMany) {
        formControl = new FormArrayWithAttribute([]);

        const itemArray = entity ? (entity as any)[nextAttribute.name] as [] : null;
        let itemCount = itemArray ? itemArray.length : 0;
        if (itemArray && itemCount > 0) {
          const attributeCell = this.findCellForAttribute(nextAttribute, template);
          if(attributeCell) {
            const childTemplate = attributeCell.template;
            if (childTemplate) {
              for (let i = 0; i < itemCount; i++) {
                const childEntity = itemArray[i];
                formControl.push(this.createFormGroup(mode, childTemplate, metaEntityList, childEntity))
              }
            }
          }
        }
      }
      else if (nextAttribute.type === AttributeType.OneToOne) {
        const attributeCell = this.findCellForAttribute(nextAttribute, template);
        if(attributeCell) {
          const childTemplate = attributeCell.template;
          if (childTemplate) {
            const childEntity = entity ? (entity as any)[nextAttribute.name] : null;
            formControl = this.createFormGroup(mode, childTemplate, metaEntityList, childEntity);
          }
        }
      }
      else if (nextAttribute.type === AttributeType.Date) {
        formControl = new FormControlWithAttribute({value: '', disabled: mode === 'view'});
      }
      else {
        // WARNING: This has been a bit of a cockroach problem. One of these two lines is "correct" but depending on
        // the low level sequence of processing elsewhere the "right" answer is either '' or null. If you change this
        // line you'll probably get subtle bugs elsewhere. Ideally I'd like it to be null but Angular and JS seem to
        // prefer ''. Don't even get me started on undefined.
        formControl = new FormControlWithAttribute({value: '', disabled: mode === 'view'});
        //formControl = new FormControlWithAttribute({value: null, disabled: mode === 'view'});
      }

      if(formControl) {
        if(nextAttribute.visibility === VisibilityType.Required) {
          formControl.addValidators(Validators.required);
        }

        formControl.attribute = nextAttribute;
        controls[nextAttribute.name] = formControl;
      }
    }

    return new FormGroup(controls);
  }

  findCellForAttribute(attribute: MetaAttribute, template: Template): Cell | null {
    for(const nextRow of template.cells) {
      for(const nextCell of nextRow) {
        if(nextCell.attributeName === attribute.name) {
          return nextCell;
        }
      }
    }
    return null;
  }

}
