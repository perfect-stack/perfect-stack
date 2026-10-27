import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { LabelComponent } from './label.component';
import { AttributeType, ComparisonOperator, VisibilityType } from '../../../../../domain/meta.entity';

describe('LabelComponent', () => {
  let component: LabelComponent;
  let fixture: ComponentFixture<LabelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LabelComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(LabelComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return base attribute name for labelForId when idSuffix is not supplied', () => {
    component.attribute = {
      name: 'organism_id',
      label: 'Organism ID',
      description: '',
      type: AttributeType.Text,
      visibility: VisibilityType.Visible,
      comparisonField: '',
      comparisonOperator: ComparisonOperator.Equals,
      rules: [],
      scale: '',
      unitOfMeasure: '',
    } as any;
    expect(component.labelForId).toBe('organism_id');
  });

  it('should include idSuffix for labelForId when idSuffix is supplied', () => {
    component.attribute = {
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
    } as any;
    component.idSuffix = 'occurrences_1';
    expect(component.labelForId).toBe('occurrence_notes-occurrences_1');
  });
});
