import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UntypedFormArray, UntypedFormControl, UntypedFormGroup, FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AssertionSelectorComponent } from './assertion-selector.component';
import { AssertionTypeService } from '../../../../data-service/assertion-type.service';
import { AssertionType, AssertionValueClass } from '../../../../../domain/assertion';

describe('AssertionSelectorComponent', () => {
  let component: AssertionSelectorComponent;
  let fixture: ComponentFixture<AssertionSelectorComponent>;
  let mockAssertionTypeService: jasmine.SpyObj<AssertionTypeService>;

  const mockTypes: AssertionType[] = [
    {
      id: 'type-1',
      assertion_type_name: 'Body Length',
      assertion_unit: 'mm',
      assertion_value_class: AssertionValueClass.Double,
    },
    {
      id: 'type-2',
      assertion_type_name: 'Weight',
      assertion_unit: 'kg',
      assertion_value_class: AssertionValueClass.Double,
    },
    {
      id: 'type-3',
      assertion_type_name: 'Life Stage',
      assertion_unit: '',
      assertion_value_class: AssertionValueClass.Enumeration,
    },
  ];

  beforeEach(async () => {
    mockAssertionTypeService = jasmine.createSpyObj<AssertionTypeService>('AssertionTypeService', [
      'loadAssertionTypes',
      'getAllAssertionTypes',
    ]);

    mockAssertionTypeService.loadAssertionTypes.and.returnValue(of(mockTypes));
    mockAssertionTypeService.getAllAssertionTypes.and.returnValue(mockTypes);

    await TestBed.configureTestingModule({
      declarations: [AssertionSelectorComponent],
      imports: [FormsModule, NgbModule],
      providers: [
        { provide: AssertionTypeService, useValue: mockAssertionTypeService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AssertionSelectorComponent);
    component = fixture.componentInstance;
    component.formArray = new UntypedFormArray([]);
    component.mode = 'edit';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter out assertion types that already exist in formArray (uniqueness rule)', (done) => {
    // Add type-1 to formArray
    const existingRow = new UntypedFormGroup({
      assertion_type_id: new UntypedFormControl('type-1'),
    });
    component.formArray.push(existingRow);

    // Search for "e" which matches all 3 types
    component.search(of('e')).subscribe(results => {
      // type-1 should be excluded
      const ids = results.map(r => r.id);
      expect(ids).not.toContain('type-1');
      expect(ids).toContain('type-2'); // Weight
      expect(ids).toContain('type-3'); // Life Stage
      done();
    });
  });

  it('should emit assertionTypeSelected and clear input upon selection', () => {
    spyOn(component.assertionTypeSelected, 'emit');

    const fakeEvent: any = {
      item: mockTypes[1], // Weight
      preventDefault: jasmine.createSpy('preventDefault'),
    };

    component.searchTerm = 'Weight';
    component.onSelectItem(fakeEvent);

    expect(fakeEvent.preventDefault).toHaveBeenCalled();
    expect(component.assertionTypeSelected.emit).toHaveBeenCalledWith(mockTypes[1]);
    expect(component.searchTerm).toBe('');
  });
});
