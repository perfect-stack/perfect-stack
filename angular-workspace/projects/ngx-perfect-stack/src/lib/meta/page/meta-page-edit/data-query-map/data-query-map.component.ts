import {Component, Input, OnInit} from '@angular/core';
import {DataQuery, QueryType, ResultCardinalityType} from '../../../../domain/meta.page';
import {MetaEntityService} from '../../../entity/meta-entity-service/meta-entity.service';
import {Observable, of, switchMap} from 'rxjs';

@Component({
  selector: 'lib-data-query-map',
  templateUrl: './data-query-map.component.html',
  styleUrls: ['./data-query-map.component.css']
})
export class DataQueryMapComponent implements OnInit {

  @Input()
  dataQueryList: DataQuery[];

  metaEntityNames$: Observable<string[]>;

  constructor(protected readonly metaEntityService: MetaEntityService) { }

  ngOnInit(): void {
    this.metaEntityNames$ = this.metaEntityService.metaEntityMap$.pipe(switchMap((metaEntityMap) => {
      return of(Array.from(metaEntityMap.keys()));
    }));
  }

  onAddDataQuery() {
    this.dataQueryList.push(new DataQuery());
  }

  getResultCardinalityOptions() {
    return Object.keys(ResultCardinalityType);
  }

  getQueryTypeOptions() {
    return Object.keys(QueryType);
  }

  onDelete(i: number) {
    this.dataQueryList?.splice(i, 1);
  }
}
