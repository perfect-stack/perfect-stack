import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { Component, forwardRef, Input, NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core';
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
  });

  it('should create and initialize assertion type details', () => {
    component.layoutStyle = 'Card';
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.assertionTypeName).toBe('Total Weight');
    expect(component.assertionUnit).toBe('kg');
    expect(component.valueClass).toBe(AssertionValueClass.Double);
    expect(component.numericCell).toBeDefined();
  });

  it('should toggle details panel', () => {
    component.layoutStyle = 'Card';
    fixture.detectChanges();
    expect(component.expanded).toBeFalse();
    component.toggleDetails();
    expect(component.expanded).toBeTrue();
    component.toggleDetails();
    expect(component.expanded).toBeFalse();
  });

  it('should emit delete with the row index', () => {
    component.layoutStyle = 'Card';
    fixture.detectChanges();
    spyOn(component.delete, 'emit');
    component.onDelete();
    expect(component.delete.emit).toHaveBeenCalledWith(0);
  });

  it('should correctly parse pipe-delimited enum options', () => {
    const parsed = component.parseEnumOptions('Female | Male | Hermaphrodite | Undetermined');
    expect(parsed).toEqual(['Female', 'Male', 'Hermaphrodite', 'Undetermined']);
  });

  it('should correctly parse JSON array enum options', () => {
    const parsed = component.parseEnumOptions('["Info", "Warning", "Error"]');
    expect(parsed).toEqual(['Info', 'Warning', 'Error']);
  });

  it('should correctly parse comma-delimited enum options as fallback', () => {
    const parsed = component.parseEnumOptions('Cat, Dog, Bird');
    expect(parsed).toEqual(['Cat', 'Dog', 'Bird']);
  });

  it('should handle empty or whitespace enum options gracefully', () => {
    expect(component.parseEnumOptions('')).toEqual([]);
    expect(component.parseEnumOptions('   ')).toEqual([]);
    expect(component.parseEnumOptions(undefined)).toEqual([]);
    expect(component.parseEnumOptions(null)).toEqual([]);
  });

  it('should initialize enumeration cell and attribute when assertionType is Enumeration', () => {
    const enumType: AssertionType = {
      id: 'type-sex',
      assertion_type_name: 'Sex',
      assertion_value_class: AssertionValueClass.Enumeration,
      assertion_value_enum_options: 'Female | Male | Hermaphrodite | Undetermined',
    };

    component.assertionType = enumType;
    component.ngOnChanges({
      assertionType: new SimpleChange(null, enumType, false),
    });

    expect(component.valueClass).toBe(AssertionValueClass.Enumeration);
    expect(component.enumOptions).toEqual(['Female', 'Male', 'Hermaphrodite', 'Undetermined']);
    expect(component.enumerationAttribute).toBeDefined();
    expect(component.enumerationAttribute.enumeration).toEqual(['Female', 'Male', 'Hermaphrodite', 'Undetermined']);
    expect(component.enumerationCell).toBeDefined();
    expect(component.enumerationCell.attribute).toBe(component.enumerationAttribute);
  });

  it('should compute assertionValueDisplay correctly for various value types', () => {
    component.layoutStyle = 'Field';
    fixture.detectChanges();
    expect(component.assertionValueDisplay).toBe('14.5');

    component.formGroup.get('assertion_value_numeric')?.setValue(null);

    component.valueClass = AssertionValueClass.Boolean;
    component.formGroup.addControl('assertion_value_boolean', new UntypedFormControl(true));
    expect(component.assertionValueDisplay).toBe('Yes');

    component.formGroup.get('assertion_value_boolean')?.setValue(false);
    expect(component.assertionValueDisplay).toBe('No');

    component.valueClass = AssertionValueClass.Text;
    component.formGroup.get('assertion_value_text')?.setValue('Normal findings');
    expect(component.assertionValueDisplay).toBe('Normal findings');
  });

  it('should format DateTime in perfect-stack format dd-MMM-yyyy HH:mm', () => {
    expect(component.formatDateTime('2026-10-01T07:56:00')).toBe('01-Oct-2026 07:56');
    expect(component.formatDateTime('2026-10-01T07:56')).toBe('01-Oct-2026 07:56');

    component.formGroup.get('assertion_value_numeric')?.setValue(null);
    component.valueClass = AssertionValueClass.DateTime;
    component.formGroup.addControl('assertion_value_date_time', new UntypedFormControl('2026-10-01T07:56:00'));
    expect(component.assertionValueDisplay).toBe('01-Oct-2026 07:56');
  });

  it('should format Date in perfect-stack format dd-MMM-yyyy', () => {
    expect(component.formatDate('2026-10-01')).toBe('01-Oct-2026');

    component.formGroup.get('assertion_value_numeric')?.setValue(null);
    component.valueClass = AssertionValueClass.Date;
    component.formGroup.addControl('assertion_value_date', new UntypedFormControl('2026-10-01'));
    expect(component.assertionValueDisplay).toBe('01-Oct-2026');
  });

  it('should detect populated valueClass on fresh load even when type is not yet cached', () => {
    mockAssertionTypeService.getAssertionType.and.returnValue(undefined);
    component.assertionType = undefined;

    const freshForm = new UntypedFormGroup({
      assertion_type_id: new UntypedFormControl('uncached-type'),
      assertion_type_name: new UntypedFormControl('Body Mass'),
      assertion_unit: new UntypedFormControl('g'),
      assertion_value_numeric: new UntypedFormControl(1100),
      assertion_value_text: new UntypedFormControl(null),
    });
    component.formGroup = freshForm;
    component.layoutStyle = 'Field';
    component.mode = 'view';
    fixture.detectChanges();

    expect(component.valueClass).toBe(AssertionValueClass.Double);
    expect(component.assertionValueDisplay).toBe('1100');

    const rootEl: HTMLElement = fixture.nativeElement;
    const valueDisplayEl = rootEl.querySelector('.assertion-value-display');
    expect(valueDisplayEl?.textContent?.trim()).toBe('1100 g');
  });

  it('should render em-dash for empty Notes field instead of falling back to No', () => {
    const notesType: AssertionType = {
      id: 'type-notes',
      assertion_type_name: 'Notes',
      assertion_value_class: AssertionValueClass.Text,
    };
    mockAssertionTypeService.getAssertionType.and.returnValue(notesType);
    component.assertionType = notesType;

    const notesForm = new UntypedFormGroup({
      assertion_type_id: new UntypedFormControl('type-notes'),
      assertion_type_name: new UntypedFormControl('Notes'),
      assertion_value_text: new UntypedFormControl(null),
      assertion_value_boolean: new UntypedFormControl(false),
    });
    component.formGroup = notesForm;
    component.layoutStyle = 'Field';
    component.mode = 'view';
    fixture.detectChanges();

    expect(component.assertionValueDisplay).toBe('');

    const rootEl: HTMLElement = fixture.nativeElement;
    const valueDisplayEl = rootEl.querySelector('.assertion-value-display');
    expect(valueDisplayEl?.textContent?.trim()).toBe('—');
  });

  it('should render Field layout in view mode without input-group and with space before unit', () => {
    component.layoutStyle = 'Field';
    component.mode = 'view';
    fixture.detectChanges();

    const rootEl: HTMLElement = fixture.nativeElement;
    const labelEl = rootEl.querySelector('label');
    expect(labelEl).toBeTruthy();
    expect(labelEl?.textContent?.trim()).toBe('Total weight');

    const inputGroupEl = rootEl.querySelector('.input-group');
    expect(inputGroupEl).toBeFalsy();

    const valueDisplayEl = rootEl.querySelector('.assertion-value-display');
    expect(valueDisplayEl).toBeTruthy();
    expect(valueDisplayEl?.textContent?.trim()).toBe('14.5 kg');
  });

  it('should render Field layout in edit mode with label on top and input-group below', () => {
    component.layoutStyle = 'Field';
    component.mode = 'edit';
    fixture.detectChanges();

    const rootEl: HTMLElement = fixture.nativeElement;
    const labelEl = rootEl.querySelector('label');
    expect(labelEl).toBeTruthy();
    expect(labelEl?.textContent?.trim()).toBe('Total weight');

    const inputGroupEl = rootEl.querySelector('.input-group');
    expect(inputGroupEl).toBeTruthy();

    const unitEl = inputGroupEl?.querySelector('.input-group-text');
    expect(unitEl?.textContent?.trim()).toBe('kg');

    const inputEl = inputGroupEl?.querySelector('input[type="number"]');
    expect(inputEl).toBeTruthy();
  });
});
