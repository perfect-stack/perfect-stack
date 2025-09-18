import {Component, EventEmitter, Inject, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {ControlValueAccessor, NgControl} from '@angular/forms';
import {MetaAttribute} from '../../../../../domain/meta.entity';
import {DataService} from '../../../../data-service/data.service';
import {Subscription} from 'rxjs';
import {CellAttribute} from "../../../../../meta/page/meta-page-service/meta-page.service";
import {ValidationResult} from "../../../../../domain/meta.rule";

@Component({
    selector: 'lib-select-control',
    templateUrl: './select-control.component.html',
    styleUrls: ['./select-control.component.css'],
    standalone: false
})
export class SelectControlComponent implements OnInit, OnDestroy, ControlValueAccessor {

  @Input()
  attribute: MetaAttribute;

  @Input()
  mode: string | null;

  @Input()
  cell: CellAttribute;

  @Output()
  selectedEntityEvent = new EventEmitter();

  selectedEntityId: string;
  selectedEntity: any;

  optionList: any[];
  optionListSubscription: Subscription;

  disabled = false;

  // Comparison function; local variable equals exported function
  byEntityOrId = byEntityOrId;

  constructor(protected readonly dataService: DataService,
              public ngControl: NgControl) {
    ngControl.valueAccessor = this;
  }

  ngOnInit(): void {
    if(this.mode !== 'view') {
      this.optionListSubscription = this.dataService.findAll(this.attribute.relationshipTarget, '', 1, 999).subscribe((response) => {
        this.optionList = response.resultList;
        if(this.optionList && this.optionList.length > 0) {
          const firstElement = this.optionList[0];
          if(firstElement) {
            if(firstElement.sort_index) {
              this.optionList.sort((a, b) => a.sort_index - b.sort_index);
            }
            else {
              this.optionList.sort((a,b) => {
                const displayA =this.getDisplayText(a).toUpperCase();
                const displayB = this.getDisplayText(b).toUpperCase();
                if(displayA < displayB ) {
                  return -1;
                }
                else if(displayA > displayB) {
                  return 1;
                }
                else {
                  return 0;
                }
              });
            }
          }
        }
        this.updateSelectedEntity();
      });
    }
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
    console.log(`onModelChange() ${this.attribute.name}`, selectedEntity);
    //this.value = selectedEntity ? selectedEntity.id : null;
    this.value = selectedEntity ? selectedEntity.id : '';
  }

  ngOnDestroy(): void {
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
    else {
      // we may not ever get an optionList (e.g. view mode) but if we have the id then just do a look of the entity that way
      if(this.selectedEntityId) {
        this.dataService.findByIdUsingCache(this.attribute.relationshipTarget, this.selectedEntityId).subscribe((response) => {
          this.selectedEntity = response;
        });
      }
    }
  }

  set value(val: string){
    this.selectedEntityId = val
    this.updateSelectedEntity();

    console.log(`onChange() ${val}`);
    this.onChange(val)
    //this.onTouch(val)
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

  hasErrors() {
    return this.ngControl.errors !== null;
  }

  get validationResult() {
    return this.ngControl.errors as ValidationResult;
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

