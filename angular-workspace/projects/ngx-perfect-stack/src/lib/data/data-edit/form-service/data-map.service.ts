import {Injectable} from '@angular/core';
import {DataQuery, QueryType, ResultCardinalityType} from '../../../domain/meta.page';
import {forkJoin, Observable, of, switchMap} from 'rxjs';
import {DataService} from '../../data-service/data.service';
import {QueryRequest} from '../../data-service/query.request';
import {AttributeType, ComparisonOperator} from '../../../domain/meta.entity';


export interface DataMapItem {
  dataName: string,
  result: any
  totalCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class DataMapService {

  constructor(protected readonly dataService: DataService) {
  }

  toDataMap(dataQueryList: DataQuery[], parameterMap: any): Observable<Map<string, any>> {
    const dataMap: Map<string, any> = new Map();

    const sources: any = {};
    for(const nextQuery of dataQueryList) {
      sources[nextQuery.dataName] = this.observeQuery(nextQuery, parameterMap);
    }

    return forkJoin(sources).pipe(switchMap((results: any) => {
      for(const nextResultKey of Object.keys(results)) {
        dataMap.set(nextResultKey, results[nextResultKey]);
      }
      return of(dataMap);
    }));
  }

  observeQuery(dataQuery: DataQuery, parameterMap: any): Observable<DataMapItem> {
    switch (dataQuery.queryType) {
      case QueryType.Entity:
        return this.observeEntityQuery(dataQuery, parameterMap);
      case QueryType.Custom:
        return this.observeCustomQuery(dataQuery, parameterMap);
      default:
        throw new Error(`Unknown queryType of ${dataQuery.queryType}`);
    }
  }

  private observeEntityQuery(dataQuery: DataQuery, parameterMap: any): Observable<DataMapItem> {
    switch (dataQuery.resultCardinality) {
      case ResultCardinalityType.QueryOne:
        if(parameterMap[dataQuery.parameter]) {
          return this.dataService.findById(dataQuery.queryName, parameterMap[dataQuery.parameter]).pipe(switchMap(value => {
            return of({dataName: dataQuery.dataName, result: value, totalCount: 1});
          }));
        }
        else {
          return of({dataName: dataQuery.dataName, result: null, totalCount: 0});
        }
      case ResultCardinalityType.QueryMany:
        const queryRequest = new QueryRequest();
        queryRequest.metaEntityName = dataQuery.queryName;
        queryRequest.criteria.push({
          name: dataQuery.fieldName,
          attributeType: AttributeType.Text, // TODO: this probably isn't right but DataMap doesn't have any concept of Attribute or field/parameter type yet. This will do for now.
          operator: ComparisonOperator.Equals,
          value: parameterMap[dataQuery.parameter]
        });

        if(dataQuery.orderByName) {
          queryRequest.orderByName = dataQuery.orderByName;
        }

        if(dataQuery.orderByDir) {
          queryRequest.orderByDir = dataQuery.orderByDir;
        }

        return this.dataService.findByCriteria(queryRequest).pipe(switchMap(response => {
          return of({dataName: dataQuery.dataName, result: response.resultList, totalCount: response.totalCount});
        }));
      default:
        throw new Error(`Unknown ResultCardinalityType of ${dataQuery.resultCardinality}`);
    }
  }

  private observeCustomQuery(dataQuery: DataQuery, parameterMap: any) {

    // CustomQuery got replaced by the new SearchController approach, so this doesn't do anything at the moment. If
    // it's needed in the future we'll need to look at how/why it's different to the SearchController approach.
    return of({dataName: dataQuery.dataName, result: [], totalCount: 0});

    /*if(dataQuery.resultCardinality === ResultCardinalityType.QueryMany) {

      const queryRequest = new QueryRequest();
      queryRequest.customQuery = dataQuery.queryName;  // TODO: this is about the only difference between an EntityQuery and a CustomQuery (could probably be refactored)
      queryRequest.criteria.push({
        name: dataQuery.fieldName,
        attributeType: AttributeType.Text, // TODO: this probably isn't right but DataMap doesn't have any concept of Attribute or field/parameter type yet. This will do for now.
        operator: ComparisonOperator.Equals,
        value: parameterMap[dataQuery.parameter]
      });

      if(dataQuery.orderByName) {
        queryRequest.orderByName = dataQuery.orderByName;
      }

      if(dataQuery.orderByDir) {
        queryRequest.orderByDir = dataQuery.orderByDir;
      }

      // TODO: Hack for DEV testing
      queryRequest.pageSize = 20;

      return this.dataService.findByCriteria(queryRequest).pipe(switchMap(response => {
        return of({dataName: dataQuery.dataName, result: response.resultList, totalCount: response.totalCount});
      }));

    }
    else {
      throw new Error('TODO: ResultCardinalityType.QueryOne is not implemented for CustomQuery yet');
    }*/
  }

}
