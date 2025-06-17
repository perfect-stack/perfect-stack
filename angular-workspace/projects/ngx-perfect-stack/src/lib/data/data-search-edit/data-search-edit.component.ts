import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {MetaEntityService} from '../../meta/entity/meta-entity-service/meta-entity.service';
import {DataService} from '../data-service/data.service';
import {Observable, of, switchMap, tap} from 'rxjs';
import {QueryRequest} from '../data-service/query.request';
import {QueryResponse} from '../data-service/query.response';
import {Entity} from '../../domain/entity';
import {MetaEntity} from '../../domain/meta.entity';
import {DataSearchActionEvent} from './data-search-action-event';

//import * as uuid from 'uuid';
import {v4 as uuidv4} from 'uuid';
import {MessageDialogComponent} from '../../utils/message-dialog/message-dialog.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ActionType} from '../../domain/meta.role';

@Component({
    selector: 'app-data-search-edit',
    templateUrl: './data-search-edit.component.html',
    styleUrls: ['./data-search-edit.component.css'],
    standalone: false
})
export class DataSearchEditComponent implements OnInit {

  public metaName: string;
  public mode = 'search';

  metaEntity$: Observable<MetaEntity>;
  rowData$: Observable<QueryResponse<Entity>>;

  editSet = new Set();

  constructor(protected readonly route: ActivatedRoute,
              protected readonly router: Router,
              protected readonly metaEntityService: MetaEntityService,
              protected modalService: NgbModal,
              protected readonly dataService: DataService) { }

  ngOnInit(): void {
    this.metaEntity$ = this.route.paramMap.pipe(switchMap(params => {
      const metaName = params.get('metaName');
      if (metaName) {
        this.metaName = metaName
        this.onSearch();
        return this.metaEntityService.metaEntityMap$.pipe(switchMap( (metaEntityMap) => {
          const metaEntity = metaEntityMap.get(this.metaName);
          if(metaEntity) {
            return of(metaEntity);
          }
          else {
            throw new Error(`Unable to find metaEntity for; ${this.metaName}`);
          }
        }));
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
      case 'delete':
        this.onStartDelete(event.id)
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

  onStartDelete(id: string) {
    const modalRef = this.modalService.open(MessageDialogComponent)
    const modalComponent: MessageDialogComponent = modalRef.componentInstance;
    modalComponent.title = `Delete ${this.metaName} Confirmation`;
    modalComponent.text = `This action will delete the ${this.metaName}. It cannot be undone.`;
    modalComponent.actions = [
      {name: 'Cancel', style: 'btn btn-outline-primary'},
      {name: 'Delete', style: 'btn btn-danger'},
    ];

    modalRef.closed.subscribe((closedResult) => {
      console.log(`Message Dialog closedResult = ${closedResult}`);
      if(closedResult === 'Delete') {
        this.dataService.destroy(this.metaName, id).subscribe(() => {
          this.onSearch();
        });
      }
    });
  }

  onNew(rowData: QueryResponse<Entity>) {
    const newEntity = {
      id: uuidv4(),
      sort_index: rowData.resultList.length, // length is already the last index plus one
    };

    rowData.resultList.push(newEntity);
    this.onStartEdit(newEntity.id);
  }

  get ActionType() {
    return ActionType;
  }
}
