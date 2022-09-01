import { Injectable } from '@angular/core';
import {ActionListener} from '../../event/action-listener';
import {FormContext, FormService} from '../data-edit/form-service/form.service';
import {Property, PropertyType} from '../../template/property-sheet/property-sheet.service';
import {AbstractControl, FormGroup} from '@angular/forms';
import {PropertyListProvider} from '../../template/property-sheet/property-list-provider';
import {QueryRequest} from '../data-service/query.request';
import {AttributeType, ComparisonOperator} from '../../domain/meta.entity';
import {DataService} from '../data-service/data.service';
import {DataQuery} from '../../domain/meta.page';


/**sa
 * The Search Criteria performs two actions; search and reset. It needs to know the name of the criteria form in the
 * form map and the name of the result table output form also in the form map. With this metadata it can then perform
 * the actions when invoked by the event service.
 */
@Injectable({
  providedIn: 'root'
})
export class SearchControllerService implements ActionListener, PropertyListProvider {

  propertyList: Property[] = [
    { name: 'channel', type: PropertyType.string},
    { name: 'criteria', type: PropertyType.string},
    { name: 'query', type: PropertyType.string},
    { name: 'results', type: PropertyType.string},
  ];

  channel: string; // channel on which this controller will listen for events
  criteria: string; // name of the form where the search criteria are coming from
  query: string; // name of the DataMap query which this controller will use to convert criteria into search results
  results: string; // name of the form where the search results are to be displayed

  constructor(protected readonly dataService: DataService,
              protected readonly formService: FormService) { }

  onAction(ctx: FormContext, channel: string, action: string): void {
    console.log(`SearchControllerService: onAction: "${action}" for channel "${channel}", our channel is "${this.channel}"`);
    console.log(` - criteria form ${this.criteria}`)
    console.log(` - query ${this.query}`)
    console.log(` - results form ${this.results}`)

    // filter by channel here???
    this.search(ctx);
  }

  init(ctx: FormContext) {
    // do something when the page loads, in this case perform the default search
    this.search(ctx);
  }

  search(ctx: FormContext) {
    // get the criteria form
    // convert into a query request
    // execute the query
    // set the result into the right table form

    const criteriaForm = this.getCriteriaForm(ctx);
    const dataQuery = ctx.metaPage.dataQueryList.find(s => s.dataName === this.query);
    if(dataQuery) {
      const queryRequest = this.toQueryRequest(dataQuery, ctx);
      this.dataService.findByCriteria(queryRequest).subscribe(response => {

        console.log(`got ${response.resultList.length} of ${response.totalCount} results`)

        // TODO: this needs to be metadata driven
        const birdTab = ctx.metaPageMap.get('ProjectBird.tab');
        if(birdTab) {
          const template = birdTab.templates[0];
          const form = this.getResultsForm(ctx);
          if(form) {
            console.log(`update form with search results:`, form);
            this.formService.updateFormGroupForDataMapItemQueryMany(form as FormGroup, ctx, template, response.resultList);
            criteriaForm.get('pageNumber')?.setValue(queryRequest.pageNumber);
            criteriaForm.get('pageSize')?.setValue(queryRequest.pageSize);
            criteriaForm.get('collectionSize')?.setValue(response.totalCount);
          }
        }
      });
    }
    else {
      throw new Error(`Unable to find DataQuery ${this.query} for MetaPage ${ctx.metaPage.name}`);
    }
  }

  toQueryRequest(dataQuery: DataQuery, ctx: FormContext):QueryRequest {

    const queryRequest = new QueryRequest();

    // WARNING: slight difference here between customQuery and Entity queries
    queryRequest.customQuery = dataQuery.queryName;

    if(ctx.paramMap && dataQuery.parameter) {
      const paramValue = ctx.paramMap.get(dataQuery.parameter);
      if(paramValue) {
        queryRequest.criteria.push({
          name: dataQuery.fieldName,
          attributeType: AttributeType.Text,
          operator: ComparisonOperator.Equals,
          value: paramValue
        });
      }
    }

    queryRequest.orderByName = dataQuery.orderByName;
    queryRequest.orderByDir = dataQuery.orderByDir;
    queryRequest.pageNumber = this.getPageNumber(ctx);
    queryRequest.pageSize = this.getPageSize(ctx);

    return queryRequest;
  }

  reset(ctx: FormContext) {
    // get the criteria form
    // reset the form
  }

  getPageNumber(ctx: FormContext): number {
    return Number(this.getControl(ctx, 'pageNumber').value);
  }

  getPageSize(ctx: FormContext): number {
    return Number(this.getControl(ctx, 'pageSize').value);
  }

  getControl(ctx: FormContext, controlName: string): AbstractControl {
    const control = this.getCriteriaForm(ctx).get(controlName);
    if(control) {
      return control;
    }
    else {
      throw new Error(`Unable to find Control for ${controlName}`);
    }
  }

  getCriteriaForm(ctx: FormContext): FormGroup {
    return this.getForm(ctx, this.criteria);
  }

  getResultsForm(ctx: FormContext): FormGroup {
    return this.getForm(ctx, this.results);
  }

  getForm(ctx: FormContext, formName: string) {
    if(ctx.formMap.has(formName)) {
      return ctx.formMap.get(formName) as FormGroup;
    }
    else {
      throw new Error(`Unable to find form for ${formName}`);
    }
  }

}
