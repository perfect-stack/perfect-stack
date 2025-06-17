import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormControl, UntypedFormGroup, Validators} from '@angular/forms';
import {MetaAttribute, MetaEntity} from '../../../domain/meta.entity';
import {DataSearchActionEvent} from '../data-search-action-event';
import {DataService} from '../../data-service/data.service';
import {FormControlWithAttribute} from '../../data-edit/form-service/form.service';
import {CellAttribute} from '../../../meta/page/meta-page-service/meta-page.service';

@Component({
    selector: '[app-row-edit]', // NOTE: using [] syntax here so cells are nested inside "tr" correctly
    templateUrl: './row-edit.component.html',
    styleUrls: ['./row-edit.component.css'],
    standalone: false
})
export class RowEditComponent implements OnInit {

  @Input()
  metaEntity: MetaEntity;

  @Input()
  entity: any;

  @Output()
  actionEvent = new EventEmitter<DataSearchActionEvent>();

  formGroup = new UntypedFormGroup({
    id: new FormControlWithAttribute(''),
    status: new FormControlWithAttribute(''),
    name: new FormControlWithAttribute('', Validators.required),
    description: new FormControlWithAttribute(''),
    start_date: new FormControlWithAttribute(null),
    end_date: new FormControlWithAttribute(null),
    sort_index: new FormControlWithAttribute(''),
  });

  cellMap = new Map<string, CellAttribute>();

  constructor(protected readonly dataService: DataService) { }

  ngOnInit(): void {
    this.formGroup.patchValue(this.entity);

    this.metaEntity.attributes.forEach((attribute) => {
      const formControlWithAttribute = this.formGroup.get(attribute.name) as FormControlWithAttribute;
      formControlWithAttribute.attribute = attribute;

      // while we're looping let's create the CellAttribute's we need too
      this.cellMap.set(attribute.name, this.createCell(attribute.name));
    });
  }

  findAttribute(name: string): MetaAttribute {
    return this.metaEntity.attributes.find(x => x.name === name) || new MetaAttribute();
  }

  createCell(name: string): CellAttribute {
    const cell = new CellAttribute();
    cell.attribute = this.findAttribute(name);
    return cell;
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

  getCellFor(name: string): CellAttribute {
    const cell = this.cellMap.get(name);
    if(cell) {
      return cell;
    }
    else {
      throw new Error(`Unable to find CellAttribute for ${name}`);
    }
  }

  get startDateAttribute(): MetaAttribute {
    const cell = this.getCellFor('start_date');
    if(cell && cell.attribute) {
      return cell.attribute;
    }
    else {
      throw new Error('')
    }
  }

  get endDateAttribute(): MetaAttribute {
    const cell = this.getCellFor('end_date');
    if(cell && cell.attribute) {
      return cell.attribute;
    }
    else {
      throw new Error('')
    }
  }
}
