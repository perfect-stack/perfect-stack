import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {ControlValueAccessor, FormControlStatus, NG_VALUE_ACCESSOR} from '@angular/forms';
import {MetaAttribute} from '../../../../../domain/meta.entity';
import {DataService} from '../../../../data-service/data.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'lib-select-control',
  templateUrl: './select-control.component.html',
  styleUrls: ['./select-control.component.css'],
  providers: [{provide: NG_VALUE_ACCESSOR, useExisting: SelectControlComponent, multi: true}]
})
export class SelectControlComponent implements OnInit, OnDestroy, ControlValueAccessor {

  @Input()
  attribute: MetaAttribute;

  @Input()
  mode: string | null;

  @Output()
  selectedEntityEvent = new EventEmitter();

  selectedEntityId: string;
  selectedEntity: any;

  optionList: any[];
  optionListSubscription: Subscription;

  status: FormControlStatus = 'PENDING';
  statusSubscription: Subscription;

  disabled = false;

  // Comparison function; local variable equals exported function
  byEntityOrId = byEntityOrId;

  constructor(protected readonly dataService: DataService) { }

  ngOnInit(): void {
    // this.statusSubscription = this.formGroup.controls[this.attribute.name].statusChanges.subscribe((formControlStatus) => {
    //   this.status = formControlStatus;
    // });

    this.optionListSubscription = this.dataService.findAll(this.attribute.relationshipTarget).subscribe((response) => {
      this.optionList = response.resultList;
      this.updateSelectedEntity();
    });
  }

  get attribute_name_id() {
    return (this.attribute.name + '_id').toLowerCase();
  }

  isReadOnly() {
    return this.mode === 'view';
  }

  getDisplayText(option: any) {
    let displayValue = '';
    for(const displayAttributeName of this.attribute.typeaheadSearch) {
      displayValue += option[displayAttributeName];
      displayValue += ' ';
    }
    return displayValue;
  }

  onModelChange(selectedEntity: any) {
    console.log('onModelChange()', selectedEntity);
    //this.value = selectedEntity ? selectedEntity.id : null;
    this.value = selectedEntity ? selectedEntity.id : '';
  }

  ngOnDestroy(): void {
    if(this.statusSubscription) {
      this.statusSubscription.unsubscribe();
    }
    if(this.optionListSubscription) {
      this.optionListSubscription.unsubscribe();
    }
  }

  /**
   * The id may arrive before the entity list has been downloaded, or the entity list may be downloaded before the id
   * is set. So we need call this method whenever either changes but only do the actual selection if both are set.
   */
  updateSelectedEntity() {
    if(this.optionList) {
      if(this.selectedEntityId) {
        this.selectedEntity = this.optionList.find(x => x.id === this.selectedEntityId);
      }
      else {
        this.selectedEntity = null;
      }

      this.selectedEntityEvent.next(this.selectedEntity);
    }
  }

  set value(val: string){
    this.selectedEntityId = val
    this.updateSelectedEntity();
    this.onChange(val)
    this.onTouch(val)
  }

  onChange: any = () => {}
  onTouch: any = () => {}

  registerOnChange(fn: any): void {
    this.onChange = fn
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  writeValue(obj: any): void {
    this.value = obj;
  }
}

/**
 * This function returns true if the supplied parameters are "matched". The supplied parameters can be either an Id
 * or an Entity, but we won't know which is which. They are matched if any independent Id matches the Id of the Entity.
 * @param entity1
 * @param entity2
 */
export const byEntityOrId = (entity1: any, entity2: any): boolean => {
  const findId = (entity: any) => {
    return entity && entity.id ? entity.id : entity;
  }

  const id_1 = findId(entity1);
  const id_2 = findId(entity2);
  if(id_1 && id_2) {
    return id_1 === id_2;
  }
  else {
    return id_1 === null && id_2 === null;
  }
}

