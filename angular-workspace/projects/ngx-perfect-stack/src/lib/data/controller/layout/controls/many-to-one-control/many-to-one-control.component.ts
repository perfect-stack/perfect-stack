import {Component, ElementRef, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ControlValueAccessor, UntypedFormGroup, NgControl} from '@angular/forms';
import {MetaAttribute, MetaEntity} from '../../../../../domain/meta.entity';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  Observable,
  of,
  OperatorFunction,
  switchMap,
  tap
} from 'rxjs';
import {TypeaheadService} from './typeahead.service';
import {Item} from './typeahead.response';
import {NgbTypeaheadSelectItemEvent} from '@ng-bootstrap/ng-bootstrap';
import {DataService} from '../../../../data-service/data.service';
import {EventService} from '../../../../../event/event.service';
import {FormContext} from '../../../../data-edit/form-service/form.service';
import {ValidationResult} from '../../../../../domain/meta.rule';
import {Cell} from '../../../../../domain/meta.page';

@Component({
  selector: 'lib-many-to-one-control',
  templateUrl: './many-to-one-control.component.html',
  styleUrls: ['./many-to-one-control.component.css'],
})
export class ManyToOneControlComponent implements OnInit, OnDestroy, ControlValueAccessor {

  @Input()
  mode: string | null;

  @Input()
  ctx: FormContext;

  @Input()
  formGroup: UntypedFormGroup;

  @Input()
  metaEntity: MetaEntity;

  @Input()
  attribute: MetaAttribute;

  @Input()
  cell: Cell;

  @ViewChild('searchInput')
  searchInput: ElementRef;

  selectedModelId: string | null;
  selectedModel: any | null;

  searching = false;
  searchFailed = false;

  disabled = false;

  constructor(protected readonly dataService: DataService,
              protected readonly eventService: EventService,
              protected readonly typeaheadService: TypeaheadService,
              public ngControl: NgControl) {
    ngControl.valueAccessor = this;
  }

  ngOnInit(): void {
  }

  search: OperatorFunction<string, readonly Item[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.searching = true),
      switchMap((term) => {
        if (term) {
          return this.typeaheadService.search(term, this.metaEntity, this.attribute).pipe(
            tap(() => this.searchFailed = false),
            catchError(() => {
              this.searchFailed = true;
              return of([]);
            }))
        } else {
          return of([]);
        }
      }),
      tap(() => this.searching = false)
    );

  formatter = (x: {displayText: string}) => x.displayText;

  isReadOnly() {
    return this.mode === 'view' ? true : null;
  }

  onSelectItem(event: NgbTypeaheadSelectItemEvent<Item>) {
    const item = event.item;
    if(item && item.id) {
      console.log('onSelectItem', event.item);
      this.setValueByItem(item);

      // Dispatch event for the item selected
      if(this.ctx) {
        this.eventService.dispatchOnManyToOneItemSelected(this.ctx.metaPage.name, this.formGroup, this.attribute, item);
      }
    }
    else {
      console.warn('Not sure if this code path actually happens or not');
    }
  }

  onClear() {
    this.setValueById(null);
  }

  setValueByItem(item: Item | null) {
    if(item) {
      this.selectedModelId = item.id;
      this.selectedModel = item;
      this.onChange(this.selectedModelId)
    }
    else {
      this.selectedModelId = null;
      this.selectedModel = null;
      this.onChange(null);
    }
  }

  setValueById(id: string | null) {
    if(id) {
      this.typeaheadService.searchById(id, this.metaEntity, this.attribute).subscribe((items) => {
        if(items && items.length === 1) {
          this.setValueByItem(items[0]);
        }
      });
    }
    else {
      this.setValueByItem(null)
    }
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
    this.setValueById(obj);
  }

  ngOnDestroy(): void {
  }

  onFocusOut($event: FocusEvent) {
    console.log(`onFocusOut`, $event);
    this.writeValue(this.selectedModelId);
  }

  hasErrors() {
    return this.ngControl.errors !== null;
  }

  get validationResult() {
    return this.ngControl.errors as ValidationResult;
  }

  get showClear(): boolean {
    return this.selectedModelId !== null && (this.cell && this.cell.showClear !== 'false');
  }

}
