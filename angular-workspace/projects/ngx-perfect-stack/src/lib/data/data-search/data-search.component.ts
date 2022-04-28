import {Component, OnInit} from '@angular/core';
import {Observable, of, switchMap} from 'rxjs';
import {AttributeType, MetaAttribute} from '../../domain/meta.entity';
import {ActivatedRoute, Router} from '@angular/router';
import {DataService} from '../data-service/data.service';
import {Entity} from '../../domain/entity';
import {CellAttribute} from '../../meta/page/meta-page-service/meta-page.service';
import {FormContext, FormControlWithAttribute, FormService} from '../data-edit/form-service/form.service';
import {MetaEntityService} from '../../meta/entity/meta-entity-service/meta-entity.service';
import {Criteria, QueryRequest} from '../data-service/query.request';

@Component({
  selector: 'app-data-search',
  templateUrl: './data-search.component.html',
  styleUrls: ['./data-search.component.css']
})
export class DataSearchComponent implements OnInit {

  public metaName: string | null;
  public mode = 'search';

  resultTableCells: CellAttribute[][];

  public pageNumber = 1;
  public pageSize = 50;
  public collectionSize = 0;
  public searchResults: Entity[] = [];

  ctx$: Observable<FormContext>;

  constructor(protected readonly route: ActivatedRoute,
              protected readonly router: Router,
              protected readonly formService: FormService,
              protected readonly metaEntityService: MetaEntityService,
              protected readonly dataService: DataService) { }

  ngOnInit(): void {
    this.ctx$ = this.route.paramMap.pipe(switchMap(params => {
      this.metaName = params.get('metaName');

      if(this.metaName) {
        return this.formService.loadFormContext(this.metaName, this.mode, null).pipe(switchMap( (ctx) => {
          const resultTableTemplate = ctx.metaPage.templates[1];
          const resultTableMetaEntityName = resultTableTemplate.metaEntityName;
          const rtme = ctx.metaEntityMap.get(resultTableMetaEntityName);
          if(rtme) {
            this.resultTableCells = this.formService.toCellAttributeArray(resultTableTemplate, rtme);
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

  onSearch(ctx: FormContext) {
    if(this.metaName) {
      const entityForm = ctx.entityForm;
      const resultTableTemplate = ctx.metaPage.templates[1];
      const orderByName = resultTableTemplate.orderByName;
      const orderByDir = resultTableTemplate.orderByDir;

      const queryRequest = new QueryRequest();
      queryRequest.metaEntityName = this.metaName;
      queryRequest.orderByName = orderByName;
      queryRequest.orderByDir = orderByDir;
      queryRequest.pageNumber = this.pageNumber;
      queryRequest.pageSize = this.pageSize;

      for (let controlsKey in entityForm.controls) {
        const control = entityForm.controls[controlsKey];
        if(control instanceof FormControlWithAttribute) {
          const attribute = control.attribute;
          const criteria = new Criteria();
          criteria.name = attribute.name;
          criteria.operator = attribute.comparisonOperator;
          criteria.value = String(control.value);

          queryRequest.criteria.push(criteria);
        }
      }

      this.dataService.findByCriteria(queryRequest).subscribe(response => {
        this.searchResults = response.resultList;
        this.collectionSize = response.totalCount;
      });
    }
  }

  displayValue(metaAttribute: MetaAttribute, item: any) {
    if(Object.keys(item).includes(metaAttribute.name)) {
      if(metaAttribute.type === AttributeType.ManyToOne) {
        let displayValue = '';
        if(item[metaAttribute.name]) {
          for(const displayAttributeName of metaAttribute.typeaheadSearch) {
            displayValue += item[metaAttribute.name][displayAttributeName];
            displayValue += ' ';
          }
        }
        return displayValue;
      }
      else {
        return item[metaAttribute.name];
      }
    }
    else {
      return `Unknown attribute name of ${metaAttribute.name} in row data of ${JSON.stringify(item)}`
    }
  }

  onSelectRow(id: string) {
    this.router.navigate([`/data/${this.metaName}/view/${id}`]);
  }

  onReset() {

  }

  onNew(ctx: FormContext) {
    this.router.navigate([`/data/${this.metaName}/edit/**NEW**`]);
  }
}
