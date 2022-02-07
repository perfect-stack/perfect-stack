import {Component, Input, OnInit} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {MetaAttribute} from '../../../../domain/meta.entity';
import {catchError, debounceTime, distinctUntilChanged, Observable, of, OperatorFunction, switchMap, tap} from 'rxjs';
import {TypeaheadService} from './typeahead.service';
import {Item} from './typeahead.response';

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


  model: any;
  searching = false;
  searchFailed = false;

  constructor(protected readonly typeaheadService: TypeaheadService) {
  }

  ngOnInit(): void {
  }

  search: OperatorFunction<string, readonly Item[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.searching = true),
      switchMap(term =>
        this.typeaheadService.search(term).pipe(
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

}
