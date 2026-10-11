import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UntypedFormArray, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AssertionListControlComponent } from './assertion-list-control.component';
import { FormGroupService } from '../../../../data-edit/form-service/form-group.service';
import { MetaEntityService } from '../../../../../meta/entity/meta-entity-service/meta-entity.service';
import { MetaPageService, CellAttribute } from '../../../../../meta/page/meta-page-service/meta-page.service';
import { AssertionTypeService } from '../../../../data-service/assertion-type.service';
import { ActivityTemplateService } from '../../../../data-service/activity-template.service';
import { AssertionType, AssertionValueClass } from '../../../../../domain/assertion';
import { AttributeType, MetaAttribute } from '../../../../../domain/meta.entity';

describe('AssertionListControlComponent', () => {
  let component: AssertionListControlComponent;
  let fixture: ComponentFixture<AssertionListControlComponent>;
  let mockFormGroupService: jasmine.SpyObj<FormGroupService>;
  let mockMetaEntityService: jasmine.SpyObj<MetaEntityService>;
  let mockMetaPageService: jasmine.SpyObj<MetaPageService>;
  let mockAssertionTypeService: jasmine.SpyObj<AssertionTypeService>;
  let mockActivityTemplateService: jasmine.SpyObj<ActivityTemplateService>;

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

    mockActivityTemplateService = jasmine.createSpyObj<ActivityTemplateService>('ActivityTemplateService', [
      'getActivityTemplate',
      'getSynchronous',
      'clearCache',
    ]);
    mockActivityTemplateService.getActivityTemplate.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      declarations: [AssertionListControlComponent],
      providers: [
        { provide: FormGroupService, useValue: mockFormGroupService },
        { provide: MetaEntityService, useValue: mockMetaEntityService },
        { provide: MetaPageService, useValue: mockMetaPageService },
        { provide: AssertionTypeService, useValue: mockAssertionTypeService },
        { provide: ActivityTemplateService, useValue: mockActivityTemplateService },
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
    component.layoutStyle = 'Card';
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

  it('should lay out Field style assertions in a row with col-4 grid items', () => {
    const fixture2 = TestBed.createComponent(AssertionListControlComponent);
    const comp2 = fixture2.componentInstance;
    comp2.layoutStyle = 'Field';
    comp2.cell = component.cell;
    comp2.formGroup = new UntypedFormGroup({
      assertions: new UntypedFormArray([
        new UntypedFormGroup({ id: new UntypedFormControl('1') }),
        new UntypedFormGroup({ id: new UntypedFormControl('2') }),
        new UntypedFormGroup({ id: new UntypedFormControl('3') }),
      ]),
    });
    fixture2.detectChanges();

    const rootEl: HTMLElement = fixture2.nativeElement;
    const rowEl = rootEl.querySelector('.row.assertion-items-list');
    expect(rowEl).toBeTruthy();

    const colEls = rootEl.querySelectorAll('.col-4');
    expect(colEls.length).toBe(3);
  });

  it('should resolve layoutStyle dynamically from activityTemplate when layoutStyle is not set', () => {
    component.layoutStyle = undefined;
    component.activityTemplate = {
      id: 'tmpl-1',
      activity_template_name: 'Visual Health Check',
      layout_style: 'Field',
    };

    expect(component.resolvedLayoutStyle).toBe('Field');
  });

  it('should reactively load ActivityTemplate when activity_template_id changes on formGroup', () => {
    const mockTmplField = { id: 'tmpl-field', layout_style: 'Field' };
    const mockTmplTable = { id: 'tmpl-table', layout_style: 'Table' };

    mockActivityTemplateService.getActivityTemplate.and.callFake((id: string) => {
      if (id === 'tmpl-field') return of(mockTmplField);
      if (id === 'tmpl-table') return of(mockTmplTable);
      return of(null);
    });

    const templateIdControl = new UntypedFormControl('tmpl-field');
    const formGroupWithTemplate = new UntypedFormGroup({
      activity_template_id: templateIdControl,
      assertions: new UntypedFormArray([]),
    });

    const fixture2 = TestBed.createComponent(AssertionListControlComponent);
    const comp2 = fixture2.componentInstance;
    comp2.cell = component.cell;
    comp2.formGroup = formGroupWithTemplate;

    fixture2.detectChanges();

    expect(mockActivityTemplateService.getActivityTemplate).toHaveBeenCalledWith('tmpl-field');
    expect(comp2.activityTemplate).toEqual(mockTmplField);
    expect(comp2.resolvedLayoutStyle).toBe('Field');

    // Change template ID reactively
    templateIdControl.setValue('tmpl-table');

    expect(mockActivityTemplateService.getActivityTemplate).toHaveBeenCalledWith('tmpl-table');
    expect(comp2.activityTemplate).toEqual(mockTmplTable);
    expect(comp2.resolvedLayoutStyle).toBe('Table');
  });
});
