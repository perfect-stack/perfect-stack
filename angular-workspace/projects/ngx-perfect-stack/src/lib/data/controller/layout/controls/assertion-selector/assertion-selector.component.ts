import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { UntypedFormArray } from '@angular/forms';
import { Observable, OperatorFunction, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { NgbTypeaheadSelectItemEvent } from '@ng-bootstrap/ng-bootstrap';
import { AssertionType } from '../../../../../domain/assertion';
import { AssertionTypeService } from '../../../../data-service/assertion-type.service';

@Component({
  selector: 'lib-assertion-selector',
  templateUrl: './assertion-selector.component.html',
  styleUrls: ['./assertion-selector.component.css'],
  standalone: false
})
export class AssertionSelectorComponent implements OnInit {

  @Input()
  formArray: UntypedFormArray;

  @Input()
  mode: string | null;

  @Output()
  assertionTypeSelected = new EventEmitter<AssertionType>();

  @ViewChild('typeaheadInput')
  typeaheadInput: ElementRef<HTMLInputElement>;

  searchTerm: any = '';

  constructor(protected readonly assertionTypeService: AssertionTypeService) { }

  ngOnInit(): void {
    // Preload types into cache
    this.assertionTypeService.loadAssertionTypes().subscribe();
  }

  formatter = (item: AssertionType) => item ? item.assertion_type_name : '';

  search: OperatorFunction<string, readonly AssertionType[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(term => {
        if (!term || term.trim().length < 1) {
          return of([]);
        }

        const existingTypeIds = new Set<string>();
        if (this.formArray && this.formArray.controls) {
          for (const ctrl of this.formArray.controls) {
            const typeId = ctrl.get('assertion_type_id')?.value;
            if (typeId) {
              existingTypeIds.add(typeId);
            }
          }
        }

        const allTypes = this.assertionTypeService.getAllAssertionTypes();
        const lowerTerm = term.toLowerCase().trim();

        const filtered = allTypes.filter(t =>
          !existingTypeIds.has(t.id) &&
          t.assertion_type_name &&
          t.assertion_type_name.toLowerCase().includes(lowerTerm)
        ).slice(0, 10);

        return of(filtered);
      })
    );

  onSelectItem(event: NgbTypeaheadSelectItemEvent): void {
    event.preventDefault();
    const selectedItem: AssertionType = event.item;
    if (selectedItem) {
      this.assertionTypeSelected.emit(selectedItem);
      this.searchTerm = '';
      if (this.typeaheadInput) {
        this.typeaheadInput.nativeElement.value = '';
      }
    }
  }
}
