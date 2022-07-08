import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {ControlValueAccessor, FormControlStatus, NG_VALUE_ACCESSOR} from '@angular/forms';
import {MetaAttribute} from '../../../../../domain/meta.entity';
import {DataService} from '../../../../data-service/data.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-select-control',
  templateUrl: './select-control.component.html',
  styleUrls: ['./select-control.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: SelectControlComponent,
      multi: true
    }]
})
export class SelectControlComponent implements OnInit, OnDestroy, ControlValueAccessor {

  @Input()
  attribute: MetaAttribute;

  @Input()
  mode: string | null;

  selectedEntity_id: string;
  selectedEntity: any;

  optionList: any[];
  optionListSubscription: Subscription;

  status: FormControlStatus = 'PENDING';
  statusSubscription: Subscription;

  disabled = false;

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

  byEntityId(entity1: any, entity2: any) {
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
      if(this.selectedEntity_id) {
        this.selectedEntity = this.optionList.find(x => x.id === this.selectedEntity_id);
      }
      else {
        this.selectedEntity = null;
      }
    }
  }

  set value(val: string){
    this.selectedEntity_id = val
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
