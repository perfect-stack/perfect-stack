import {Injectable} from '@angular/core';
import {CellAttribute, MetaPageService} from '../../../meta/page/meta-page-service/meta-page.service';
import {MetaEntityService} from '../../../meta/entity/meta-entity-service/meta-entity.service';
import {DataService} from '../../data-service/data.service';
import {Cell, DataQuery, MetaPage, ResultCardinalityType, Template} from '../../../domain/meta.page';
import {
  AbstractControl,
  AbstractControlOptions, AsyncValidatorFn,
  UntypedFormArray,
  UntypedFormControl, FormControlOptions,
  UntypedFormGroup,
  ValidatorFn,
} from '@angular/forms';
import {Observable, of, switchMap} from 'rxjs';
import {MetaAttribute, MetaEntity} from '../../../domain/meta.entity';
import {DataMapService} from './data-map.service';
import {ParamMap} from '@angular/router';
import {FormGroupService} from './form-group.service';


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
  paramMap: ParamMap;
  queryParamMap: ParamMap;
}

export class FormControlWithAttribute extends UntypedFormControl {
  attribute: MetaAttribute;
  constructor(formState?: any, validatorOrOpts?: ValidatorFn | ValidatorFn[] | FormControlOptions | null, asyncValidator?: AsyncValidatorFn | AsyncValidatorFn[] | null) {
    super(formState, validatorOrOpts, asyncValidator);
  }
}

export class FormArrayWithAttribute extends UntypedFormArray {
  attribute: MetaAttribute;
  constructor(controls: AbstractControl[], validatorOrOpts?: ValidatorFn | ValidatorFn[] | AbstractControlOptions | null, asyncValidator?: AsyncValidatorFn | AsyncValidatorFn[] | null) {
    super(controls, validatorOrOpts, asyncValidator);
  }
}

@Injectable({
  providedIn: 'root'
})
export class FormService {

  constructor(protected readonly formGroupService: FormGroupService,
              protected readonly metaPageService: MetaPageService,
              protected readonly metaEntityService: MetaEntityService,
              protected readonly dataMapService: DataMapService,
              protected readonly dataService: DataService) {
  }

  loadFormContext(metaName: string, mode: string, id: string | null, paramMap: ParamMap | null, queryParamMap: ParamMap | null): Observable<FormContext> {

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

    if(paramMap) {
      ctx.paramMap = paramMap;
    }

    if(queryParamMap) {
      ctx.queryParamMap = queryParamMap;
    }

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
            console.log('FormService: dataMap:', dataMap);
            ctx.formMap = this.createFormMap(ctx, ctx.metaPage.templates, ctx.metaPage.dataQueryList, dataMap);
            console.log('FormService: formMap:', ctx.formMap);
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

      // we only want one form per binding, so we only need to create the form once for each binding
      const existingForm = formMap.get(template.binding);
      if(!existingForm) {

        // Use the Template to find the data it is bound to...
        const dataQuery = dataQueryList.find(a => a.dataName === template.binding);
        if(dataQuery) {
          // ...but the data type of the data determines the FormGroup not the template
          const metaEntityName = dataQuery.queryName
          const dataMapItem = dataMap.get(template.binding);
          const form = this.createFormGroupForDataMapItem(ctx, metaEntityName, dataQuery.resultCardinality, template, dataMapItem.result);
          formMap.set(template.binding, form);
        }
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
    let form: UntypedFormGroup;
    switch (resultCardinality) {
      case ResultCardinalityType.QueryOne:
        // The dataValue result is a single object we only need one form
        if(metaEntityName) {
          form = this.formGroupService.createFormGroup(ctx.mode, metaEntityName, ctx.metaPageMap, ctx.metaEntityMap, objectOrArray);

          if(objectOrArray) {
            console.log('FormService: about to patch form', form);
            console.log('FormService: with objectOrArray', objectOrArray);
            form.patchValue(objectOrArray);
            console.log('FormService: form value patched value', form.value);
          }
        }
        else {
          throw new Error(`If ResultCardinalityType.QueryOne then metaEntityName must be supplied but has not been`);
        }
        break;
      case ResultCardinalityType.QueryMany:
        // The dataValue result is an array so create the same number of form rows
        const rowCount = objectOrArray.length;
        const formArray = new UntypedFormArray([]);
        for(let i = 0; i < rowCount; i++) {
          const formRow = this.formGroupService.createFormGroup(ctx.mode, template.metaEntityName, ctx.metaPageMap, ctx.metaEntityMap, null);
          formArray.push(formRow);
        }

        form = new UntypedFormGroup({});
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
      cellAttribute.metaEntity = metaEntity;
      cellAttribute.attribute = attribute;
    }

    return cellAttribute;
  }
}
