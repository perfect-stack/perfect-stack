import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MetaAttribute, MetaEntity} from '../../../domain/meta.entity';
import {DataSearchActionEvent} from '../data-search-action-event';
import {DataService} from '../../data-service/data.service';
import {FormControlWithAttribute} from '../../data-edit/form-service/form.service';

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
    id: new FormControlWithAttribute(''),
    status: new FormControlWithAttribute(''),
    name: new FormControlWithAttribute('', Validators.required),
    description: new FormControlWithAttribute(''),
    start_date: new FormControlWithAttribute(null),
    end_date: new FormControlWithAttribute(null),
    sort_index: new FormControlWithAttribute(''),
  });

  constructor(protected readonly dataService: DataService) { }

  ngOnInit(): void {
    this.formGroup.patchValue(this.entity);

    this.metaEntity.attributes.forEach((attribute) => {
      const formControlWithAttribute = this.formGroup.get(attribute.name) as FormControlWithAttribute;
      formControlWithAttribute.attribute = attribute;
    });
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
