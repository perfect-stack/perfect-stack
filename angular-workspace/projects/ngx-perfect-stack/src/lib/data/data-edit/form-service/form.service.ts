import {Injectable} from '@angular/core';
import {CellAttribute, MetaPageService} from '../../../meta/page/meta-page-service/meta-page.service';
import {MetaEntityService} from '../../../meta/entity/meta-entity-service/meta-entity.service';
import {DataService} from '../../data-service/data.service';
import {Entity} from '../../../domain/entity';
import {Cell, DataQuery, MetaPage, ResultCardinalityType, Template} from '../../../domain/meta.page';
import {AbstractControl, FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {Observable, of, switchMap} from 'rxjs';
import {AttributeType, MetaAttribute, MetaEntity, VisibilityType} from '../../../domain/meta.entity';
import {DataMapService} from './data-map.service';
import {NewFormService} from './new-form.service';


export class FormContext {
  metaName: string;
  mode: string;
  id: string | null;
  metaPage: MetaPage;
  metaPageMap: Map<string, MetaPage>;
  metaEntity: MetaEntity;
  metaEntityMap: Map<string, MetaEntity>;
  dataMap: Map<string, any>;
  formMap: Map<string, AbstractControl>;
  //entity: Entity;
  //entityForm: FormGroup;
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

  constructor(protected readonly newFormService: NewFormService,
              protected readonly metaPageService: MetaPageService,
              protected readonly metaEntityService: MetaEntityService,
              protected readonly dataMapService: DataMapService,
              protected readonly dataService: DataService) {
  }

  loadFormContext(metaName: string, mode: string, id: string | null): Observable<FormContext> {

    let pageKey = mode === 'view' || mode === 'edit' ? 'view_edit' : mode;

    // TODO: DON't COMMIT THIS!!! - hack for DataQueryMap feature
    //const pageKey = mode === 'view' || mode === 'edit' ? 'view' : mode;
    if(mode === 'view' && metaName === 'Bird') {
      pageKey = 'view';
    }

    const metaPageName = `${metaName}.${pageKey}`;
    const ctx = new FormContext();
    ctx.metaName = metaName;
    ctx.mode = mode;
    ctx.id = id;

    return this.metaPageService.metaPageMap$.pipe(switchMap((metaPageMap) => {
      ctx.metaPageMap = metaPageMap;
      ctx.metaPage = ctx.metaPageMap.get(metaPageName) as MetaPage;

      return this.metaEntityService.metaEntityMap$.pipe(switchMap((metaEntityMap) => {

        ctx.metaEntityMap = metaEntityMap;

        const rootTemplate = ctx.metaPage.templates[0];
        const metaEntityName = rootTemplate.metaEntityName

        const me = ctx.metaEntityMap.get(metaEntityName);
        if (!me) {
          throw new Error(`Unable to find MetaEntity for ${metaName}`);
        }
        ctx.metaEntity = me;

        if(ctx.metaPage.dataQueryList?.length > 0) {
          console.log('FormService: load dataQueryList:', ctx.metaPage.dataQueryList);
          return this.dataMapService.toDataMap(ctx.metaPage.dataQueryList, {id: id}).pipe(switchMap((dataMap: Map<string, any>) => {
            ctx.dataMap = dataMap;
            ctx.formMap = this.createFormMap(ctx, ctx.metaPage.templates, ctx.metaPage.dataQueryList, dataMap);
            return of(ctx);
          }));
        } else if (id) {
          throw new Error('TODO: anything with an "id" should be doing a dataQuery now');
        } else {
          // No data to load, but that's ok various forms get created without any data loading
          console.log('FormService: load form with no data loaded:');
          return of(ctx);
        }
      }));
    }));
  }

  public createFormMap(ctx: FormContext, templateList: Template[], dataQueryList: DataQuery[], dataMap: Map<string, any>) {
    const formMap = new Map<string, AbstractControl>();
    for(const nextTemplate of templateList) {
      this.createFormMapForOneTemplate(ctx, nextTemplate, formMap, dataQueryList, dataMap);
    }
    return formMap;
  }

  private createFormMapForOneTemplate(ctx: FormContext,
                                      template: Template,
                                      formMap: Map<string, AbstractControl>,
                                      dataQueryList: DataQuery[],
                                      dataMap: Map<string, any>) {
    if(template.binding) {
      // Use the Template to find the data it is bound to...
      const dataQuery = dataQueryList.find(a => a.dataName === template.binding);
      if(dataQuery) {
        // ...but the data type of the data determines the FormGroup not the template
        const metaEntityName = dataQuery.queryName
        const dataMapItem = dataMap.get(template.binding);
        let form = this.createFormGroupForDataMapItem(ctx, metaEntityName, dataQuery.resultCardinality, template, dataMapItem.result);
        formMap.set(template.binding, form);
      }
    }

    for(const nextCellRow of template.cells) {
      for(const nextCellCol of nextCellRow) {
        // If the cell has a Template inside it, then recursively call down into it
        const childTemplate = nextCellCol.template;
        if(childTemplate) {
          this.createFormMapForOneTemplate(ctx, childTemplate, formMap, dataQueryList, dataMap);
        }
      }
    }
  }

  public createFormGroupForDataMapItem(ctx: FormContext,
                                       metaEntityName:string | null,
                                       resultCardinality: ResultCardinalityType,
                                       template: Template,
                                       objectOrArray: any | any[]) {
    let form: FormGroup;
    switch (resultCardinality) {
      case ResultCardinalityType.QueryOne:
        // The dataValue result is a single object we only need one form
        if(metaEntityName) {
          form = this.newFormService.createFormGroup(ctx.mode, metaEntityName, ctx.metaPageMap, ctx.metaEntityMap, objectOrArray);

          if(objectOrArray) {
            form.patchValue(objectOrArray);
          }
        }
        else {
          throw new Error(`If ResultCardinalityType.QueryOne then metaEntityName must be supplied but has not been`);
        }
        break;
      case ResultCardinalityType.QueryMany:
        // The dataValue result is an array so create the same number of form rows
        const rowCount = objectOrArray.length;
        const formArray = new FormArray([]);
        for(let i = 0; i < rowCount; i++) {
          const formRow = this.createFormGroup(ctx.mode, template, ctx.metaPageMap, ctx.metaEntityMap, null);
          formArray.push(formRow);
        }

        form = new FormGroup({});
        form.addControl(template.binding, formArray);

        if(objectOrArray) {
          formArray.patchValue(objectOrArray);
        }

        break;
      default:
        throw new Error(`Unknown ResultCardinality: ${resultCardinality}`);
    }

    return form;
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


  createFormGroup(mode: string,
                  template: Template,
                  metaPageMap: Map<string, MetaPage>,
                  metaEntityMap: Map<string, MetaEntity>,
                  entity: Entity | null,
  ) {
    const controls: {
      [key: string]: AbstractControl;
    } = {};

    const templateMetaEntity = metaEntityMap.get(template.metaEntityName);
    if (!templateMetaEntity) {
      throw new Error(`Unable to find template MetaEntity of ${template.metaEntityName}`)
    }

    // loop through all MetaAttributes and add FormControls for each attribute
    for (const nextAttribute of templateMetaEntity.attributes) {
      let formControl: any;

      if (nextAttribute.type === AttributeType.OneToMany) {
        formControl = this.formControlForOneToMany(nextAttribute, mode, metaPageMap, metaEntityMap, entity);
      }
      else if(nextAttribute.type == AttributeType.OneToPoly) {
        formControl = this.formControlForOneToPoly(nextAttribute, mode, metaPageMap, metaEntityMap, entity);
      }
      else if(nextAttribute.type === AttributeType.ManyToOne) {
        formControl = this.formControlForManyToOne(nextAttribute, mode, metaPageMap, metaEntityMap, entity);
      }
      else if (nextAttribute.type === AttributeType.OneToOne) {
        formControl = this.formControlForOneToOne(nextAttribute, mode, metaPageMap, metaEntityMap, entity)
      }
      else if (nextAttribute.type === AttributeType.Date) {
        formControl = this.formControlForDate(mode);
      }
      else {
        // WARNING: This has been a bit of a cockroach problem. One of these two lines is "correct" but depending on
        // the low level sequence of processing elsewhere the "right" answer is either '' or null. If you change this
        // line you'll probably get subtle bugs elsewhere. Ideally I'd like it to be null but Angular and JS seem to
        // prefer ''. Don't even get me started on undefined.
        //formControl = new FormControlWithAttribute({value: null, disabled: mode === 'view'});
        formControl = new FormControlWithAttribute({value: '', disabled: mode === 'view'});
      }

      if(formControl) {
        if(nextAttribute.visibility === VisibilityType.Required) {
          formControl.addValidators(Validators.required);
        }

        formControl.attribute = nextAttribute;
        controls[nextAttribute.name] = formControl;
      }
      else {
        console.warn(`No formControl created for:`, nextAttribute);
      }
    }

    // Experimental: For each form add two extra for createdAt and updatedAt fields so that setValue() doesn't barf with
    // NG01001: Cannot find form control with name: 'createdAt'
    controls['createdAt'] = this.formControlForDate(mode);
    controls['updatedAt'] = this.formControlForDate(mode);


    return new FormGroup(controls);
  }

  private formControlForOneToMany(attribute: MetaAttribute,
                                  mode: string,
                                  metaPageMap: Map<string, MetaPage>,
                                  metaEntityMap: Map<string, MetaEntity>,
                                  entity: any) {
    const formControl = new FormArrayWithAttribute([]);

    const itemArray = entity ? (entity as any)[attribute.name] as [] : null;
    let itemCount = itemArray ? itemArray.length : 0;
    if (itemArray && itemCount > 0) {
      const childEntityName = attribute.relationshipTarget;
      for (let i = 0; i < itemCount; i++) {
        const childEntity = itemArray[i];
        formControl.push(this.newFormService.createFormGroup(mode, childEntityName, metaPageMap, metaEntityMap, childEntity))
      }
    }
    return formControl;
  }

  private formControlForOneToPoly(attribute: MetaAttribute,
                                  mode: string,
                                  metaPageMap: Map<string, MetaPage>,
                                  metaEntityMap: Map<string, MetaEntity>,
                                  entity: any) {
    const formControl = new FormArrayWithAttribute([]);

    // TODO: more here iterating through the children and creating their Form Controls
    const itemArray = entity ? (entity as any)[attribute.name] as [] : null;
    let itemCount = itemArray ? itemArray.length : 0;
    if (itemArray && itemCount > 0) {
      for (let i = 0; i < itemCount; i++) {
        const childEntity = itemArray[i];
        const discriminator = attribute.discriminator;
        const childDiscriminatorValue = childEntity[discriminator.discriminatorName];
        const childEntityMapping = discriminator.entityMappingList.find(a => a.discriminatorValue === childDiscriminatorValue);
        if(childEntityMapping) {
          const childPageName = childEntityMapping.metaEntityName + ".view_edit"
          const childPage = metaPageMap.get(childPageName);
          if(childPage) {
            const childTemplate = childPage.templates[0];
            console.log(`Adding formGroup for; ${attribute.name}, ${childDiscriminatorValue}, ${childPageName}`);
            formControl.push(this.createFormGroup(mode, childTemplate, metaPageMap, metaEntityMap, childEntity))
          }
        }
      }
    }

    return formControl;
  }

  private formControlForManyToOne(attribute: MetaAttribute,
                                  mode: string,
                                  metaPageMap: Map<string, MetaPage>,
                                  metaEntityMap: Map<string, MetaEntity>,
                                  entity: any) {
    const childEntityName = attribute.relationshipTarget;
    const childEntity = entity ? (entity as any)[attribute.name] : null;
    return this.newFormService.createFormGroup(mode, childEntityName, metaPageMap, metaEntityMap, childEntity);
  }

  private formControlForOneToOne(attribute: MetaAttribute,
                                 mode: string,
                                 metaPageMap: Map<string, MetaPage>,
                                 metaEntityMap: Map<string, MetaEntity>,
                                 entity: any): FormGroup | null {

    const childEntityName = attribute.relationshipTarget;
    const childEntity = entity ? (entity as any)[attribute.name] : null;
    return this.newFormService.createFormGroup(mode, childEntityName, metaPageMap, metaEntityMap, childEntity);
  }

  private formControlForDate(mode: string): FormControl {
    // See WARNING below: Date does need to be null, otherwise empty string is treated as an invalid Date and prevents
    // "no value" optional dates from allowing the form validation to be valid
    return new FormControlWithAttribute({value: null, disabled: mode === 'view'});
  }

}
