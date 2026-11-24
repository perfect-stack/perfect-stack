import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { TableLayoutComponent } from './table-layout.component';
import { MetaEntityService } from '../../../../../meta/entity/meta-entity-service/meta-entity.service';
import { FormService } from '../../../../data-edit/form-service/form.service';
import { FormGroupService } from '../../../../data-edit/form-service/form-group.service';
import { DebugService } from '../../../../../utils/debug/debug.service';
import { Template, TemplateType } from '../../../../../domain/meta.page';
import { AttributeType, MetaEntity, VisibilityType } from '../../../../../domain/meta.entity';

describe('TableLayoutComponent', () => {
  let component: TableLayoutComponent;
  let fixture: ComponentFixture<TableLayoutComponent>;
  let mockFormService: jasmine.SpyObj<FormService>;
  let mockFormGroupService: jasmine.SpyObj<FormGroupService>;

  beforeEach(async () => {
    const mockMetaEntity = {
      name: 'Item',
      pluralName: 'Items',
      attributes: [
        { name: 'common_name', label: 'Species', type: AttributeType.Text, visibility: VisibilityType.Visible },
      ],
    } as unknown as MetaEntity;

    const mockMetaEntityService = jasmine.createSpyObj<MetaEntityService>('MetaEntityService', [], {
      metaEntityMap$: of(new Map([['Item', mockMetaEntity]])),
    });
    const mockRouter = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    mockFormService = jasmine.createSpyObj<FormService>('FormService', ['toCellAttributeArray']);
    mockFormService.toCellAttributeArray.and.returnValue([[
      { width: '6', height: '1', attributeName: 'common_name', attribute: mockMetaEntity.attributes[0] } as any,
    ]]);
    mockFormGroupService = jasmine.createSpyObj<FormGroupService>('FormGroupService', ['createFormGroup']);

    await TestBed.configureTestingModule({
      declarations: [TableLayoutComponent],
      providers: [
        { provide: MetaEntityService, useValue: mockMetaEntityService },
        { provide: Router, useValue: mockRouter },
        { provide: FormService, useValue: mockFormService },
        { provide: FormGroupService, useValue: mockFormGroupService },
        { provide: DebugService, useValue: { ON: false } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TableLayoutComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should generate unique row id suffixes without parent idSuffix', () => {
    const template: Template = {
      metaEntityName: 'Item',
      binding: 'items',
      type: TemplateType.table,
      templateHeading: '',
      cells: [],
      locations: {},
      styles: '',
      orderByName: '',
      orderByDir: '',
      noItemsHtml: '',
    };
    component.template = template;
    expect(component.getRowIdSuffix(0)).toBe('items_0');
    expect(component.getRowIdSuffix(1)).toBe('items_1');
  });

  it('should generate nested row id suffixes with parent idSuffix', () => {
    const template: Template = {
      metaEntityName: 'Item',
      binding: 'items',
      type: TemplateType.table,
      templateHeading: '',
      cells: [],
      locations: {},
      styles: '',
      orderByName: '',
      orderByDir: '',
      noItemsHtml: '',
    };
    component.template = template;
    component.idSuffix = 'parent_0';
    expect(component.getRowIdSuffix(0)).toBe('parent_0_items_0');
    expect(component.getRowIdSuffix(1)).toBe('parent_0_items_1');
  });

  it('should render view-only table with no Add or Delete controls when template.displayOnly is true in edit mode', () => {
    const template: Template = {
      metaEntityName: 'Item',
      binding: 'items',
      type: TemplateType.table,
      templateHeading: 'Observation Summary',
      cells: [],
      locations: {},
      styles: '',
      orderByName: '',
      orderByDir: '',
      noItemsHtml: 'No species observations recorded for this event',
      displayOnly: true,
    };

    const formArray = new FormArray([
      new FormGroup({ common_name: new FormControl('Kiwi') }),
    ]);
    component.template = template;
    component.mode = 'edit';
    component.relationshipProperty = 'items';
    component.formGroup = new FormGroup({ items: formArray });
    fixture.detectChanges();

    expect(component.effectiveMode).toBe('view');
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[data-testid="btn-add-row"]')).toBeNull();
    expect(el.querySelector('[data-testid="btn-delete-row-0"]')).toBeNull();
    expect(el.querySelector('[data-testid="table-items"]')).not.toBeNull();

    component.onAddRow();
    expect(mockFormGroupService.createFormGroup).not.toHaveBeenCalled();
    component.onDeleteRow(0);
    expect(formArray.length).toBe(1);
  });

  it('should show noItemsHtml when empty in edit mode if template.displayOnly is true', () => {
    const template: Template = {
      metaEntityName: 'Item',
      binding: 'items',
      type: TemplateType.table,
      templateHeading: 'Observation Summary',
      cells: [],
      locations: {},
      styles: '',
      orderByName: '',
      orderByDir: '',
      noItemsHtml: '<div class="empty-msg">No species observations recorded for this event</div>',
      displayOnly: true,
    };

    component.template = template;
    component.mode = 'edit';
    component.relationshipProperty = 'items';
    component.formGroup = new FormGroup({ items: new FormArray([]) });
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[data-testid="no-items-container"]')?.textContent).toContain(
      'No species observations recorded for this event',
    );
    expect(el.querySelector('[data-testid="btn-add-row"]')).toBeNull();
    expect(el.querySelector('[data-testid="table-items"]')).toBeNull();
  });
});
