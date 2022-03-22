import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MetaAttribute, MetaEntity} from '../../../domain/meta.entity';
import {DataSearchActionEvent} from '../data-search-action-event';
import {DataService} from '../../data-service/data.service';

@Component({
  selector: '[app-row-edit]',  // NOTE: using [] syntax here so cells are nested inside "tr" correctly
  templateUrl: './row-edit.component.html',
  styleUrls: ['./row-edit.component.css']
})
export class RowEditComponent implements OnInit {

  @Input()
  metaEntity: MetaEntity;

  @Input()
  entity: any;

  @Output()
  actionEvent = new EventEmitter<DataSearchActionEvent>();

  formGroup = new FormGroup({
    id: new FormControl(''),
    status: new FormControl(''),
    name: new FormControl('', Validators.required),
    description: new FormControl(''),
    start_date: new FormControl(null),
    end_date: new FormControl(null),
    sort_index: new FormControl(''),
  });

  constructor(protected readonly dataService: DataService) { }

  ngOnInit(): void {
    this.formGroup.patchValue(this.entity);
  }

  findAttribute(name: string): MetaAttribute {
    return this.metaEntity.attributes.find(x => x.name === name) || new MetaAttribute();
  }

  onCancel() {
    console.log('onCancel');
    this.actionEvent.next({
      id: this.entity.id,
      action: 'cancel'
    });
  }

  onSave() {
    console.log('onSave');
    const newValue = this.formGroup.value;
    this.dataService.save(this.metaEntity.name, newValue).subscribe(() => {
      this.actionEvent.next({
        id: this.entity.id,
        action: 'save'
      });
    });
  }
}
