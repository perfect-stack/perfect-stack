import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {FormControlStatus, FormGroup} from '@angular/forms';
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
  tap
} from 'rxjs';
import {TypeaheadService} from './typeahead.service';
import {Item} from './typeahead.response';
import {NgbTypeaheadSelectItemEvent} from '@ng-bootstrap/ng-bootstrap';
import {DataService} from '../../../../data-service/data.service';
import {EventService} from '../../../../../event/event.service';
import {FormContext} from '../../../../data-edit/form-service/form.service';

@Component({
  selector: 'app-many-to-one-control',
  templateUrl: './many-to-one-control.component.html',
  styleUrls: ['./many-to-one-control.component.css']
})
export class ManyToOneControlComponent implements OnInit {

  @Input()
  mode: string | null;

  @Input()
  ctx: FormContext;

  @Input()
  formGroup: FormGroup;

  @Input()
  metaEntity: MetaEntity;

  @Input()
  attribute: MetaAttribute;

  @ViewChild('searchInput')
  searchInput: ElementRef;

  model: any;
  searching = false;
  searchFailed = false;

  displayValue: string;
  status: FormControlStatus = 'PENDING';
  statusSubscription: Subscription;

  constructor(protected readonly dataService: DataService,
              protected readonly eventService: EventService,
              protected readonly typeaheadService: TypeaheadService) {
  }

  ngOnInit(): void {
    // pump it once at the start to init
    this.updateDisplayValue(this.formGroup.controls[this.attribute.name].value);

    this.formGroup.controls[this.attribute.name].valueChanges.subscribe((dataValue) => {
      this.updateDisplayValue(dataValue);
      if(this.ctx) {
        this.eventService.dispatchOnManyToOneItemSelected(this.ctx.metaPage.name, this.formGroup, this.attribute, dataValue);
      }
    });

    this.statusSubscription = this.formGroup.controls[this.attribute.name].statusChanges.subscribe((formControlStatus) => {
      this.status = formControlStatus;
    });
  }

  search: OperatorFunction<string, readonly Item[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.searching = true),
      switchMap(term =>
        this.typeaheadService.search(term, this.metaEntity, this.attribute).pipe(
          tap(() => this.searchFailed = false),
          catchError(() => {
            this.searchFailed = true;
            return of([]);
          }))
      ),
      tap(() => this.searching = false)
    );

  formatter = (x: {displayText: string}) => x.displayText;

  isReadOnly() {
    return this.mode === 'view' ? true : null;
  }

  onSelectItem(event: NgbTypeaheadSelectItemEvent<Item>) {
    const item = event.item;
    if(item && item.id) {
      this.dataService.findById(this.attribute.relationshipTarget, item.id).subscribe(entity => {
        if(entity) {
          this.formGroup.controls[this.attribute.name].patchValue(entity);
          const controlName = (this.attribute.name + '_id').toLowerCase();
          this.formGroup.controls[controlName].setValue(item.id);
        }
      });
    }
    else {
      console.warn('Not sure if this code path actually happens or not');
    }
  }

  updateDisplayValue(dataValue: any) {
    this.displayValue = '';
    if(dataValue) {
      for(const displayAttributeName of this.attribute.typeaheadSearch) {
        if(dataValue[displayAttributeName]) {
          this.displayValue += dataValue[displayAttributeName];
          this.displayValue += ' ';
        }
      }

      this.model = dataValue;
      this.model.displayText = this.displayValue.trim();
    }
  }
}
