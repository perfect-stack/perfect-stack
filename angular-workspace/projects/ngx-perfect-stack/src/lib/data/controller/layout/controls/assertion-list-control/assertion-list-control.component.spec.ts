import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UntypedFormArray, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AssertionListControlComponent } from './assertion-list-control.component';
import { FormGroupService } from '../../../../data-edit/form-service/form-group.service';
import { MetaEntityService } from '../../../../../meta/entity/meta-entity-service/meta-entity.service';
import { MetaPageService, CellAttribute } from '../../../../../meta/page/meta-page-service/meta-page.service';
import { AssertionTypeService } from '../../../../data-service/assertion-type.service';
import { AssertionType, AssertionValueClass } from '../../../../../domain/assertion';
import { AttributeType, MetaAttribute } from '../../../../../domain/meta.entity';

describe('AssertionListControlComponent', () => {
  let component: AssertionListControlComponent;
  let fixture: ComponentFixture<AssertionListControlComponent>;
  let mockFormGroupService: jasmine.SpyObj<FormGroupService>;
  let mockMetaEntityService: jasmine.SpyObj<MetaEntityService>;
  let mockMetaPageService: jasmine.SpyObj<MetaPageService>;
  let mockAssertionTypeService: jasmine.SpyObj<AssertionTypeService>;

  beforeEach(async () => {
    mockFormGroupService = jasmine.createSpyObj<FormGroupService>('FormGroupService', ['createFormGroup']);
    mockMetaEntityService = jasmine.createSpyObj<MetaEntityService>('MetaEntityService', [], {
      metaEntityMap$: of(new Map()),
    });
    mockMetaPageService = jasmine.createSpyObj<MetaPageService>('MetaPageService', [], {
      metaPageMap$: of(new Map()),
    });
    mockAssertionTypeService = jasmine.createSpyObj<AssertionTypeService>('AssertionTypeService', [
      'loadAssertionTypes',
      'getAssertionType',
      'getAllAssertionTypes',
    ]);
    mockAssertionTypeService.loadAssertionTypes.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      declarations: [AssertionListControlComponent],
      providers: [
        { provide: FormGroupService, useValue: mockFormGroupService },
        { provide: MetaEntityService, useValue: mockMetaEntityService },
        { provide: MetaPageService, useValue: mockMetaPageService },
        { provide: AssertionTypeService, useValue: mockAssertionTypeService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AssertionListControlComponent);
    component = fixture.componentInstance;

    const cell = new CellAttribute();
    cell.attribute = {
      name: 'assertions',
      type: AttributeType.OneToMany,
      relationshipTarget: 'Assertion',
    } as MetaAttribute;
    component.cell = cell;

    const formArray = new UntypedFormArray([]);
    component.formGroup = new UntypedFormGroup({
      assertions: formArray,
    });
    component.mode = 'edit';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.relationshipProperty).toBe('assertions');
    expect(component.attributes).toBeDefined();
    expect(component.attributes?.length).toBe(0);
  });

  it('should add a new Assertion when onAddAssertion is called', () => {
    const fakeFg = new UntypedFormGroup({
      assertion_type_id: new UntypedFormControl(''),
      assertion_type_name: new UntypedFormControl(''),
      assertion_unit: new UntypedFormControl(''),
      assertion_method: new UntypedFormControl(''),
    });

    mockFormGroupService.createFormGroup.and.returnValue(fakeFg);

    const typeToAdd: AssertionType = {
      id: 'type-temp',
      assertion_type_name: 'Water Temperature',
      assertion_unit: '°C',
      assertion_value_class: AssertionValueClass.Double,
      assertion_method: 'Digital probe',
    };

    component.onAddAssertion(typeToAdd);

    expect(mockFormGroupService.createFormGroup).toHaveBeenCalled();
    expect(component.attributes?.length).toBe(1);
    expect(fakeFg.get('assertion_type_id')?.value).toBe('type-temp');
    expect(fakeFg.get('assertion_type_name')?.value).toBe('Water Temperature');
    expect(fakeFg.get('assertion_unit')?.value).toBe('°C');
    expect(fakeFg.get('assertion_method')?.value).toBe('Digital probe');
  });

  it('should remove assertion row when onDeleteAssertion is called', () => {
    const fakeFg = new UntypedFormGroup({
      id: new UntypedFormControl('1'),
    });
    component.attributes?.push(fakeFg);
    expect(component.attributes?.length).toBe(1);

    component.onDeleteAssertion(0);
    expect(component.attributes?.length).toBe(0);
  });
});
