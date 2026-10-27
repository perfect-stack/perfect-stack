import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgControl, UntypedFormControl } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TextAreaControlComponent } from './text-area-control.component';
import { AttributeType, ComparisonOperator, VisibilityType } from '../../../../../domain/meta.entity';

describe('TextAreaControlComponent', () => {
  let component: TextAreaControlComponent;
  let fixture: ComponentFixture<TextAreaControlComponent>;

  const mockNgControl = {
    valueAccessor: null as any,
    control: new UntypedFormControl(''),
    errors: null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TextAreaControlComponent],
      providers: [
        { provide: NgControl, useValue: mockNgControl },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TextAreaControlComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return base attribute name when idSuffix is not supplied', () => {
    component.cell = {
      attribute: {
        name: 'notes',
        label: 'Notes',
        description: '',
        type: AttributeType.Text,
        visibility: VisibilityType.Visible,
        comparisonField: '',
        comparisonOperator: ComparisonOperator.Equals,
        rules: [],
        scale: '',
        unitOfMeasure: '',
      },
      width: '12',
      height: '4',
    } as any;

    expect(component.componentId).toBe('notes');
  });

  it('should include idSuffix in componentId when idSuffix is supplied', () => {
    component.cell = {
      attribute: {
        name: 'occurrence_notes',
        label: 'Occurrence Notes',
        description: '',
        type: AttributeType.Text,
        visibility: VisibilityType.Visible,
        comparisonField: '',
        comparisonOperator: ComparisonOperator.Equals,
        rules: [],
        scale: '',
        unitOfMeasure: '',
      },
      width: '12',
      height: '4',
    } as any;
    component.idSuffix = 'occurrences_1';

    expect(component.componentId).toBe('occurrence_notes-occurrences_1');
  });
});
