import {Component, OnInit} from '@angular/core';
import {AttributeType, MetaEntity} from '../../domain/meta.entity';
import {ActivatedRoute, Router} from '@angular/router';
import {DataService} from '../data-service/data.service';
import {FormContext, FormControlWithAttribute, FormService} from '../data-edit/form-service/form.service';
import {MetaEntityService} from '../../meta/entity/meta-entity-service/meta-entity.service';
import {Criteria, QueryRequest} from '../data-service/query.request';
import {ResultCardinalityType, Template, TemplateNavigationType} from '../../domain/meta.page';
import {
  CustomDateParserFormatter
} from '../controller/layout/controls/date-picker-control/custom-date-parser-formatter';
import {AbstractControl, FormGroup} from '@angular/forms';
import {Observable, of, switchMap, withLatestFrom} from 'rxjs';
import {FormGroupService} from '../data-edit/form-service/form-group.service';

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
  searchResultsFormGroup: FormGroup | null;

  constructor(protected readonly customDateParserFormatter: CustomDateParserFormatter,
              protected readonly route: ActivatedRoute,
              protected readonly router: Router,
              protected readonly formService: FormService,
              protected readonly formGroupService: FormGroupService,
              protected readonly metaEntityService: MetaEntityService,
              protected readonly dataService: DataService) { }

  ngOnInit(): void {
    this.route.url.pipe(
      withLatestFrom(this.route.paramMap, this.route.queryParamMap)
    ).subscribe(([url, paramMap,  queryParamMap]) => {

      //this.ctx$ = this.route.paramMap.pipe(switchMap((params) => {
        this.metaName = paramMap.get('metaName');
        if (this.metaName) {
          this.ctx$ = this.formService.loadFormContext(this.metaName, this.mode, null, paramMap, queryParamMap).pipe(switchMap((ctx) => {

            this.searchCriteriaTemplate = ctx.metaPage.templates[0];
            this.searchCriteriaTemplate.binding = 'criteria';
            if (!ctx.formMap) {
              ctx.formMap = new Map<string, AbstractControl>();
            }
            const criteriaForm = this.formGroupService.createFormGroup(ctx.mode, this.searchCriteriaTemplate.metaEntityName, ctx.metaPageMap, ctx.metaEntityMap, null)
            ctx.formMap.set('criteria', criteriaForm);
            console.log('Criteria form:', criteriaForm);

            // Hmm - not ideal but going to set the binding name of the template so that the later formGroup stuff can be more consistent
            this.resultTableTemplate = ctx.metaPage.templates[1];
            if (!this.resultTableTemplate.binding) {
              this.resultTableTemplate.binding = 'results';
              this.resultTableTemplate.navigation = TemplateNavigationType.Enabled;
              this.resultTableTemplate.route = '/data/' + this.metaName + '/view/${id}';  // the ${id} parameter is being passed in as an expression to be resolved later
            }

            const resultTableMetaEntityName = this.resultTableTemplate.metaEntityName;
            const rtme = ctx.metaEntityMap.get(resultTableMetaEntityName);
            if (rtme) {
              this.resultTableMetaEntity = rtme;
              this.onSearch(ctx);
              return of(ctx);
            } else {
              throw new Error(`Unable to find metaEntity of; ${resultTableMetaEntityName}`);
            }
          }));
        } else {
          throw new Error('Invalid input parameters; ');
        }
      //}));
    });
  }

  onSearch(ctx: FormContext) {
    if(this.metaName) {
      this.searchResultsFormGroup = null;

      const queryRequest = new QueryRequest();
      queryRequest.metaEntityName = this.metaName;
      queryRequest.orderByName = this.resultTableTemplate.orderByName;
      queryRequest.orderByDir = this.resultTableTemplate.orderByDir;
      queryRequest.pageNumber = this.pageNumber;
      queryRequest.pageSize = this.pageSize;

      const criteriaForm = ctx.formMap.get('criteria') as FormGroup;
      for (let controlsKey in criteriaForm.controls) {
        const control = criteriaForm.controls[controlsKey];
        if(control.value && control instanceof FormControlWithAttribute) {
          queryRequest.criteria.push(this.toCriteria(control));
        }
      }

      this.dataService.findByCriteria(queryRequest).subscribe((response) => {
        this.collectionSize = response.totalCount;
        this.searchResultsFormGroup = this.formService.createFormGroupForDataMapItem(ctx, null, ResultCardinalityType.QueryMany, this.resultTableTemplate, response.resultList);
        if(!ctx.formMap) {
          ctx.formMap = new Map<string, AbstractControl>()
        }
        ctx.formMap.set('results', this.searchResultsFormGroup);
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

  onReset(ctx: FormContext) {
    const criteriaForm = ctx.formMap.get('criteria');
    console.log('onReset()', criteriaForm);
    if(criteriaForm) {
      criteriaForm.reset();
      this.onSearch(ctx);
    }
  }

  get newButtonLbl() {
    return this.metaName ? `Add ${this.metaName.toLowerCase()}` : 'Add';
  }

  onNew(ctx: FormContext) {
    this.router.navigate([`/data/${this.metaName}/edit/**NEW**`]);
  }

}
