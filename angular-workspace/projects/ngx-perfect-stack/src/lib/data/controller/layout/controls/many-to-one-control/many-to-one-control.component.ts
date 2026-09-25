import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {ControlValueAccessor, UntypedFormGroup, NgControl} from '@angular/forms';
import {MetaAttribute, MetaEntity} from '../../../../../domain/meta.entity';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  Observable,
  of,
  OperatorFunction,
  Subscription,
  switchMap,
  tap,
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
  standalone: false,
})
export class ManyToOneControlComponent implements OnInit, OnChanges, OnDestroy, ControlValueAccessor {

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

  selectedModelId: string | null = null;
  selectedModel: any | null = null;

  searching = false;
  searchFailed = false;
  typeaheadSubscription?: Subscription;

  disabled = false;

  constructor(
    protected readonly dataService: DataService,
    protected readonly eventService: EventService,
    protected readonly typeaheadService: TypeaheadService,
    protected readonly cdr: ChangeDetectorRef,
    public ngControl: NgControl,
  ) {
    ngControl.valueAccessor = this;
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['metaEntity'] || changes['attribute']) && this.selectedModelId && (!this.selectedModel || this.selectedModel.id !== this.selectedModelId)) {
      this.loadModelById(this.selectedModelId);
    }
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
            }),
          );
        } else {
          return of([]);
        }
      }),
      tap(() => {
        this.searching = false;
        this.cdr.markForCheck();
      }),
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
      this.onChange(this.selectedModelId);

      // Dispatch event for the item selected
      if(this.ctx) {
        this.eventService.dispatchOnManyToOneItemSelected(this.ctx.metaPage.name, this.formGroup, this.attribute, item);
      }
    }
    else {
      console.warn('Not sure if this code path actually happens or not');
    }
  }

  onClear($event: MouseEvent) {
    // don't let the Clear link grab focus otherwise it upsets the onfocusOut() behaviour below
    $event.preventDefault();
    this.setValueByItem(null);
    this.onChange(null);
  }

  setValueByItem(item: Item | null) {
    if(item) {
      this.selectedModelId = item.id;
      this.selectedModel = item;
    }
    else {
      this.selectedModelId = null;
      this.selectedModel = null;
    }
    this.cdr.markForCheck();
  }

  setValueById(id: string | null) {
    this.loadModelById(id);
  }

  loadModelById(id: string | null) {
    if(this.typeaheadSubscription) {
      this.typeaheadSubscription.unsubscribe();
      this.typeaheadSubscription = undefined;
    }

    this.selectedModelId = id;

    if(id && this.metaEntity && this.attribute) {
      this.typeaheadSubscription = this.typeaheadService.searchById(id, this.metaEntity, this.attribute).subscribe({
        next: (items) => {
          if(items && items.length === 1) {
            this.setValueByItem(items[0]);
          } else {
            this.setValueByItem(null);
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('ManyToOneControlComponent searchById error:', err);
          this.setValueByItem(null);
          this.cdr.markForCheck();
        },
      });
    }
    else if (!id) {
      this.setValueByItem(null);
    }
  }

  onChange: any = () => {};
  onTouch: any = () => {};

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
    this.setValueById(obj);
  }

  ngOnDestroy(): void {
    if(this.typeaheadSubscription) {
      this.typeaheadSubscription.unsubscribe();
    }
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
