import {Component, OnInit} from '@angular/core';
import {Observable, of, switchMap, withLatestFrom} from 'rxjs';
import {AttributeType, MetaEntity} from '../../domain/meta.entity';
import {ActivatedRoute, Router} from '@angular/router';
import {DataService} from '../data-service/data.service';
import {CellAttribute} from '../../meta/page/meta-page-service/meta-page.service';
import {FormContext, FormControlWithAttribute, FormService} from '../data-edit/form-service/form.service';
import {MetaEntityService} from '../../meta/entity/meta-entity-service/meta-entity.service';
import {Criteria, QueryRequest} from '../data-service/query.request';
import {ResultCardinalityType, Template, TemplateNavigationType} from '../../domain/meta.page';
import {
  CustomDateParserFormatter
} from '../controller/layout/controls/date-picker-control/custom-date-parser-formatter';
import {FormArray, FormGroup} from '@angular/forms';

@Component({
  selector: 'app-data-search',
  templateUrl: './data-search.component.html',
  styleUrls: ['./data-search.component.scss']
})
export class DataSearchComponent implements OnInit {

  public metaName: string | null;
  public mode = 'search';

  ctx$: Observable<FormContext>;

  public pageNumber = 1;
  public pageSize = 50;
  public collectionSize = 0;


  searchCriteriaTemplate: Template;

  resultTableTemplate: Template;
  resultTableMetaEntity: MetaEntity;
  resultTableCells: CellAttribute[][];

  searchResultsFormGroup: FormGroup;

  constructor(protected readonly customDateParserFormatter: CustomDateParserFormatter,
              protected readonly route: ActivatedRoute,
              protected readonly router: Router,
              protected readonly formService: FormService,
              protected readonly metaEntityService: MetaEntityService,
              protected readonly dataService: DataService) { }

  ngOnInit(): void {
    this.ctx$ = this.route.paramMap.pipe(switchMap(params => {

      this.metaName = params.get('metaName');
      if(this.metaName) {
        console.log(`XXXXX NEW SEARCH ${this.metaName} XXXXX`);

        return this.formService.loadFormContext(this.metaName, this.mode, null).pipe(switchMap( (ctx) => {

          this.searchCriteriaTemplate = ctx.metaPage.templates[0];

          // Hmm - not ideal but going to set the binding name of the template so that the later formGroup stuff
          // can be more consistent
          this.resultTableTemplate = ctx.metaPage.templates[1];
          if(!this.resultTableTemplate.binding) {
            this.resultTableTemplate.binding = 'results';
            this.resultTableTemplate.navigation = TemplateNavigationType.Enabled;
            this.resultTableTemplate.route = '/data/' + this.metaName + '/view/${id}';  // the ${id} parameter is being passed in as an expression
          }

          const resultTableMetaEntityName = this.resultTableTemplate.metaEntityName;
          const rtme = ctx.metaEntityMap.get(resultTableMetaEntityName);
          if(rtme) {
            this.resultTableMetaEntity = rtme;
            this.resultTableCells = this.formService.toCellAttributeArray(this.resultTableTemplate, rtme);
            this.onSearch(ctx);
            return of(ctx);
          }
          else {
            throw new Error(`Unable to find metaEntity of; ${resultTableMetaEntityName}`);
          }
        }));
      }
      else {
        throw new Error('Invalid input parameters; ');
      }
    }));
  }

  get newButtonLbl() {
    return this.metaName ? `Add ${this.metaName.toLowerCase()}` : 'Add';
  }

  onSearch(ctx: FormContext) {
    if(this.metaName) {

      const queryRequest = new QueryRequest();
      queryRequest.metaEntityName = this.metaName;
      queryRequest.orderByName = this.resultTableTemplate.orderByName;
      queryRequest.orderByDir = this.resultTableTemplate.orderByDir;
      queryRequest.pageNumber = this.pageNumber;
      queryRequest.pageSize = this.pageSize;

      const entityForm = ctx.entityForm;
      for (let controlsKey in entityForm.controls) {
        const control = entityForm.controls[controlsKey];
        if(control.value && control instanceof FormControlWithAttribute) {
          queryRequest.criteria.push(this.toCriteria(control));
        }
      }

      this.dataService.findByCriteria(queryRequest).subscribe((response) => {
        this.collectionSize = response.totalCount;
        this.searchResultsFormGroup = this.formService.createFormGroupForDataMapItem(ctx, null, ResultCardinalityType.QueryMany, this.resultTableTemplate, response.resultList);
      });
    }
  }

  toCriteria(control: FormControlWithAttribute) {
    const attribute = control.attribute;
    const criteria = new Criteria();
    criteria.operator = attribute.comparisonOperator;

    const byId = attribute.type === AttributeType.ManyToOne;
    if(byId) {
      criteria.name = attribute.name + '_id';
      criteria.value = control.value['id'];
    }
    else {
      criteria.name = attribute.name;
      criteria.value = String(control.value);
    }

    return criteria;
  }

  onSelectRow(id: string) {
    this.router.navigate([`/data/${this.metaName}/view/${id}`]);
  }

  onReset(ctx: FormContext) {
    ctx.entityForm.reset();
    this.onSearch(ctx);
  }

  onNew(ctx: FormContext) {
    this.router.navigate([`/data/${this.metaName}/edit/**NEW**`]);
  }

  getFormArray(formGroup: FormGroup): FormArray {
    return formGroup.controls['results'] as FormArray;
  }

  getFormGroupForRow(formGroup: FormGroup, rowIdx: number): FormGroup {
    return this.getFormArray(formGroup).at(rowIdx) as FormGroup;
  }

}
