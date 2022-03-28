import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {MetaEntity} from '../../../domain/meta.entity';
import {DataSearchActionEvent} from '../data-search-action-event';

@Component({
  selector: '[app-row-view]',  // NOTE: using [] syntax here so cells are nested inside "tr" correctly
  templateUrl: './row-view.component.html',
  styleUrls: ['./row-view.component.css']
})
export class RowViewComponent implements OnInit {

  @Input()
  entity: any;

  @Input()
  metaEntity: MetaEntity;

  @Output()
  actionEvent = new EventEmitter<DataSearchActionEvent>();

  constructor() { }

  ngOnInit(): void {
  }

  onMove(direction: number) {
    this.actionEvent.next({
      action: 'move',
      id: this.entity.id,
      direction: direction,
    });
  }

  onEdit() {
    this.actionEvent.next({
      action: 'edit',
      id: this.entity.id
    });
  }

  onDelete() {

  }
}
