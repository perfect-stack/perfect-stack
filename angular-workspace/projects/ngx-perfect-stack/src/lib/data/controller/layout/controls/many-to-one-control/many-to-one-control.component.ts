import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {MetaAttribute} from '../../../../../domain/meta.entity';
import {catchError, debounceTime, distinctUntilChanged, Observable, of, OperatorFunction, switchMap, tap} from 'rxjs';
import {TypeaheadService} from './typeahead.service';
import {Item} from './typeahead.response';
import {NgbTypeaheadSelectItemEvent} from '@ng-bootstrap/ng-bootstrap';
import {DataService} from '../../../../data-service/data.service';

@Component({
  selector: 'app-many-to-one-control',
  templateUrl: './many-to-one-control.component.html',
  styleUrls: ['./many-to-one-control.component.css']
})
export class ManyToOneControlComponent implements OnInit {

  @Input()
  formGroup: FormGroup;

  @Input()
  attribute: MetaAttribute;

  @Input()
  mode: string | null;

  @ViewChild('searchInput')
  searchInput: ElementRef;

  model: any;
  searching = false;
  searchFailed = false;

  displayValue: string;

  constructor(protected readonly dataService: DataService,
              protected readonly typeaheadService: TypeaheadService) {
  }

  ngOnInit(): void {
    this.model = this.formGroup.controls[this.attribute.name].value;
    this.updateDisplayValue();
  }

  search: OperatorFunction<string, readonly Item[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.searching = true),
      switchMap(term =>
        this.typeaheadService.search(term, this.attribute).pipe(
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
    this.dataService.findById(this.attribute.relationshipTarget, item.id).subscribe(entity => {
      this.formGroup.controls[this.attribute.name].setValue(entity);
      this.updateDisplayValue();
    });
  }

  updateDisplayValue() {
    if(this.model) {
      this.displayValue = '';
      for(const displayAttributeName of this.attribute.typeaheadSearch) {
        this.displayValue += this.formGroup.controls[this.attribute.name].value[displayAttributeName];
        this.displayValue += ' ';
      }

      //this.formGroup.controls[this.attribute.name].value.displayText = this.displayValue;
      this.model.displayText = this.displayValue;
    }
  }

  onSearchRequested() {
    this.model = null;
    this.formGroup.reset();
    setTimeout(()=>{ // this will make the execution after the above boolean has changed
      this.searchInput.nativeElement.focus();
    },0);
  }
}
