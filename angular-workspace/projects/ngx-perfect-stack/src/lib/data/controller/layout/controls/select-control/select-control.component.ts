import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import {ControlValueAccessor, NgControl} from '@angular/forms';
import {MetaAttribute} from '../../../../../domain/meta.entity';
import {DataService} from '../../../../data-service/data.service';
import {Subscription} from 'rxjs';
import {CellAttribute} from '../../../../../meta/page/meta-page-service/meta-page.service';
import {ValidationResult} from '../../../../../domain/meta.rule';

@Component({
    selector: 'lib-select-control',
    templateUrl: './select-control.component.html',
    styleUrls: ['./select-control.component.css'],
    standalone: false
})
export class SelectControlComponent implements OnInit, OnChanges, OnDestroy, ControlValueAccessor {

  @Input()
  attribute: MetaAttribute;

  @Input()
  mode: string | null;

  @Input()
  cell: CellAttribute;

  @Output()
  selectedEntityEvent = new EventEmitter();

  selectedEntityId: string | null = null;
  selectedEntity: any = null;

  optionList: any[] = [];
  isLoading = false;
  optionListSubscription: Subscription;

  disabled = false;

  // Comparison function; local variable equals exported function
  byEntityOrId = byEntityOrId;

  constructor(protected readonly dataService: DataService,
              public ngControl: NgControl,
              private readonly cdr: ChangeDetectorRef) {
    ngControl.valueAccessor = this;
  }

  ngOnInit(): void {
    console.log(`[SelectControlComponent] ngOnInit for attribute:`, this.attribute?.name, `mode:`, this.mode, `relationshipTarget:`, this.attribute?.relationshipTarget);
    this.loadOptions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['attribute'] && !changes['attribute'].isFirstChange()) ||
        (changes['mode'] && !changes['mode'].isFirstChange())) {
      this.loadOptions();
    }
  }

  loadOptions(): void {
    const target = this.attribute?.relationshipTarget;
    if (this.mode !== 'view' && target) {
      if (this.optionListSubscription) {
        this.optionListSubscription.unsubscribe();
      }
      this.isLoading = true;
      this.cdr.markForCheck();
      console.log(`[SelectControlComponent] fetching findAll for target: ${target}`);
      this.optionListSubscription = this.dataService.findAll(target, '', 1, 999).subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log(`[SelectControlComponent] received response for ${target}:`, response);
          this.optionList = response?.resultList || [];
          if (this.optionList && this.optionList.length > 0) {
            const firstElement = this.optionList[0];
            if (firstElement) {
              if (firstElement.sort_index !== undefined && firstElement.sort_index !== null) {
                this.optionList.sort((a, b) => a.sort_index - b.sort_index);
              } else {
                this.optionList.sort((a, b) => {
                  const displayA = this.getDisplayText(a).toUpperCase();
                  const displayB = this.getDisplayText(b).toUpperCase();
                  return displayA.localeCompare(displayB);
                });
              }
            }
          }
          this.updateSelectedEntity();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isLoading = false;
          console.error(`[SelectControlComponent] error fetching ${target}:`, err);
          this.optionList = [];
          this.cdr.markForCheck();
        }
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
    if (!option) return '';
    let displayValue = '';
    if (this.attribute && this.attribute.typeaheadSearch && this.attribute.typeaheadSearch.length > 0) {
      for (const displayAttributeName of this.attribute.typeaheadSearch) {
        if (option[displayAttributeName] !== undefined && option[displayAttributeName] !== null) {
          displayValue += option[displayAttributeName] + ' ';
        }
      }
    }
    const trimmed = displayValue.trim();
    return trimmed || option.name || option.scientific_name || option.title || option.id || '';
  }

  onModelChange(selectedEntity: any) {
    console.log(`[SelectControlComponent] onModelChange() ${this.attribute?.name}`, selectedEntity);
    const id = selectedEntity ? selectedEntity.id : null;
    this.value = id;
  }

  ngOnDestroy(): void {
    if (this.optionListSubscription) {
      this.optionListSubscription.unsubscribe();
    }
  }

  /**
   * The id may arrive before the entity list has been downloaded, or the entity list may be downloaded before the id
   * is set. So we need call this method whenever either changes but only do the actual selection if both are set.
   */
  updateSelectedEntity() {
    if (this.optionList && this.optionList.length > 0) {
      if (this.selectedEntityId) {
        this.selectedEntity = this.optionList.find(x => x.id === this.selectedEntityId) || null;
      } else {
        this.selectedEntity = null;
      }
      this.selectedEntityEvent.next(this.selectedEntity);
    } else {
      if (this.selectedEntityId && this.attribute?.relationshipTarget) {
        this.dataService.findByIdUsingCache(this.attribute.relationshipTarget, this.selectedEntityId).subscribe((response) => {
          this.selectedEntity = response;
          this.selectedEntityEvent.next(this.selectedEntity);
          this.cdr.markForCheck();
        });
      } else {
        this.selectedEntity = null;
      }
    }
    this.cdr.markForCheck();
  }

  set value(val: any) {
    const idVal = val && typeof val === 'object' ? val.id : (val || null);
    this.selectedEntityId = idVal;
    this.updateSelectedEntity();

    console.log(`[SelectControlComponent] onChange() ${idVal}`);
    this.onChange(idVal);
  }

  onChange: any = () => {}
  onTouch: any = () => {}

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.cdr.markForCheck();
  }

  writeValue(obj: any): void {
    const idVal = obj && typeof obj === 'object' ? obj.id : (obj || null);
    this.selectedEntityId = idVal;
    this.updateSelectedEntity();
    this.cdr.markForCheck();
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
  };

  const id_1 = findId(entity1);
  const id_2 = findId(entity2);
  if (id_1 && id_2) {
    return id_1 === id_2;
  } else {
    return !id_1 && !id_2;
  }
};
