import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { Component, forwardRef, Input, NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { AssertionControlComponent } from './assertion-control.component';
import { AssertionTypeService } from '../../../../data-service/assertion-type.service';
import { AssertionType, AssertionValueClass } from '../../../../../domain/assertion';

@Component({
  selector: 'lib-text-field-control',
  template: '',
  standalone: false,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MockTextFieldControlComponent),
      multi: true,
    },
  ],
})
class MockTextFieldControlComponent implements ControlValueAccessor {
  @Input() mode: any;
  @Input() cell: any;
  writeValue(obj: any): void {}
  registerOnChange(fn: any): void {}
  registerOnTouched(fn: any): void {}
}

describe('AssertionControlComponent', () => {
  let component: AssertionControlComponent;
  let fixture: ComponentFixture<AssertionControlComponent>;
  let mockAssertionTypeService: jasmine.SpyObj<AssertionTypeService>;

  const mockType: AssertionType = {
    id: 'type-weight',
    assertion_type_name: 'Total Weight',
    assertion_unit: 'kg',
    assertion_value_class: AssertionValueClass.Double,
    assertion_value_decimal_places: 2,
    assertion_method: 'Suspended scale',
  };

  beforeEach(async () => {
    mockAssertionTypeService = jasmine.createSpyObj<AssertionTypeService>('AssertionTypeService', [
      'getAssertionType',
      'loadAssertionTypes',
    ]);

    mockAssertionTypeService.getAssertionType.and.returnValue(mockType);
    mockAssertionTypeService.loadAssertionTypes.and.returnValue(of([mockType]));

    await TestBed.configureTestingModule({
      declarations: [AssertionControlComponent, MockTextFieldControlComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: AssertionTypeService, useValue: mockAssertionTypeService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AssertionControlComponent);
    component = fixture.componentInstance;

    component.formGroup = new UntypedFormGroup({
      assertion_type_id: new UntypedFormControl('type-weight'),
      assertion_type_name: new UntypedFormControl('Total Weight'),
      assertion_unit: new UntypedFormControl('kg'),
      assertion_value_numeric: new UntypedFormControl(14.5),
      assertion_value_text: new UntypedFormControl(''),
      assertion_method: new UntypedFormControl('Suspended scale'),
      assertion_accuracy: new UntypedFormControl('±0.1 kg'),
      assertion_notes: new UntypedFormControl('Calibrated on arrival'),
    });

    component.mode = 'edit';
    component.index = 0;
    fixture.detectChanges();
  });

  it('should create and initialize assertion type details', () => {
    expect(component).toBeTruthy();
    expect(component.assertionTypeName).toBe('Total Weight');
    expect(component.assertionUnit).toBe('kg');
    expect(component.valueClass).toBe(AssertionValueClass.Double);
    expect(component.numericCell).toBeDefined();
  });

  it('should toggle details panel', () => {
    expect(component.expanded).toBeFalse();
    component.toggleDetails();
    expect(component.expanded).toBeTrue();
    component.toggleDetails();
    expect(component.expanded).toBeFalse();
  });

  it('should emit delete with the row index', () => {
    spyOn(component.delete, 'emit');
    component.onDelete();
    expect(component.delete.emit).toHaveBeenCalledWith(0);
  });
});
