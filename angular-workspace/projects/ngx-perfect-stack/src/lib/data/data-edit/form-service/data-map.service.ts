import {Injectable} from '@angular/core';
import {DataQuery, QueryType, ResultCardinalityType} from '../../../domain/meta.page';
import {forkJoin, Observable, of, switchMap} from 'rxjs';
import {DataService} from '../../data-service/data.service';
import {QueryRequest} from '../../data-service/query.request';
import {ComparisonOperator} from '../../../domain/meta.entity';


export interface DataMapItem {
  dataName: string,
  result: any
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
            return of({dataName: dataQuery.dataName, result: value});
          }));
        }
        else {
          return of({dataName: dataQuery.dataName, result: null});
        }
      case ResultCardinalityType.QueryMany:
        const queryRequest = new QueryRequest();
        queryRequest.metaEntityName = dataQuery.queryName;
        queryRequest.criteria.push({
          name: dataQuery.fieldName,
          operator: ComparisonOperator.Equals,
          value: parameterMap[dataQuery.parameter]
        });

        return this.dataService.findByCriteria(queryRequest).pipe(switchMap(response => {
          return of({dataName: dataQuery.dataName, result: response.resultList});
        }));
      default:
        throw new Error(`Unknown ResultCardinalityType of ${dataQuery.resultCardinality}`);
    }
  }

  private observeCustomQuery(dataQuery: DataQuery, parameterMap: any) {
    if(true) {
      throw new Error(`TODO: not implemented yet`);
    }
    return of({dataName: '', result: ''});
  }

}
