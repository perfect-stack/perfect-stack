import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {MetaEntityService} from '../../meta/entity/meta-entity-service/meta-entity.service';
import {DataService} from '../data-service/data.service';
import {Observable, switchMap, tap} from 'rxjs';
import {QueryRequest} from '../data-service/query.request';
import {QueryResponse} from '../data-service/query.response';
import {Entity} from '../../domain/entity';
import {MetaEntity} from '../../domain/meta.entity';
import {DataSearchActionEvent} from './data-search-action-event';

//import * as uuid from 'uuid';
import {v4 as uuidv4} from 'uuid';

@Component({
  selector: 'app-data-search-edit',
  templateUrl: './data-search-edit.component.html',
  styleUrls: ['./data-search-edit.component.css']
})
export class DataSearchEditComponent implements OnInit {

  public metaName: string;
  public mode = 'search';

  ctx$: Observable<MetaEntity>;
  rowData$: Observable<QueryResponse<Entity>>;

  editSet = new Set();

  constructor(protected readonly route: ActivatedRoute,
              protected readonly router: Router,
              protected readonly metaEntityService: MetaEntityService,
              protected readonly dataService: DataService) { }

  ngOnInit(): void {
    this.ctx$ = this.route.paramMap.pipe(switchMap(params => {
      const metaNameOrNull = params.get('metaName');
      if (metaNameOrNull) {
        this.metaName = metaNameOrNull
        this.onSearch();
        return this.metaEntityService.findById(this.metaName)
      }
      else {
        throw new Error(`Invalid input parameters: no metaName supplied`);
      }
    }));
  }

  onSearch() {
    const queryRequest = new QueryRequest();
    queryRequest.metaEntityName = this.metaName;
    this.rowData$ = this.dataService.findByCriteria(queryRequest).pipe(tap((response) => {
      response.resultList.sort((a, b) => {
        // TODO:
        const aSortable = a as any;
        const bSortable = b as any;
        return aSortable.sort_index - bSortable.sort_index;
      });
    }));
  }

  onActionEvent(event: DataSearchActionEvent) {
    switch (event.action) {
      case 'move':
        if(event.direction && (event.direction === -1 || event.direction == 1)) {
          console.log(`Move: ${event.id}, ${event.direction}`);
          this.dataService.updateSortIndex({
            metaName: this.metaName,
            id: event.id,
            direction: event.direction,
          }).subscribe(() => {
            this.onSearch();
          });
        }
        break;
      case 'edit':
        this.onStartEdit(event.id)
        break;
      case 'cancel':
        this.onStopEdit(event.id);
        break;
      case 'save':
        this.onStopEdit(event.id);
        break;
      default:
        console.log(`Unknown action event ${event.action}`);
    }
  }

  onStartEdit(id: string) {
    this.editSet.add(id);
  }

  onStopEdit(id: string) {
    this.editSet.delete(id);
    this.onSearch();
  }

  onNew(rowData: QueryResponse<Entity>) {
    const newEntity = {
      id: uuidv4(),
      sort_index: rowData.resultList.length, // length is already the last index plus one
    };

    rowData.resultList.push(newEntity);
    this.onStartEdit(newEntity.id);
  }
}
