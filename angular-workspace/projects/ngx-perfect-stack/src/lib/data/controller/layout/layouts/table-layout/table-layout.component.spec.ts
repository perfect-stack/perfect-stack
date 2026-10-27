import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TableLayoutComponent } from './table-layout.component';
import { MetaEntityService } from '../../../../../meta/entity/meta-entity-service/meta-entity.service';
import { FormService } from '../../../../data-edit/form-service/form.service';
import { FormGroupService } from '../../../../data-edit/form-service/form-group.service';
import { DebugService } from '../../../../../utils/debug/debug.service';
import { Template, TemplateType } from '../../../../../domain/meta.page';

describe('TableLayoutComponent', () => {
  let component: TableLayoutComponent;
  let fixture: ComponentFixture<TableLayoutComponent>;

  beforeEach(async () => {
    const mockMetaEntityService = jasmine.createSpyObj<MetaEntityService>('MetaEntityService', [], {
      metaEntityMap$: of(new Map()),
    });
    const mockRouter = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    const mockFormService = jasmine.createSpyObj<FormService>('FormService', ['toCellAttributeArray']);
    const mockFormGroupService = jasmine.createSpyObj<FormGroupService>('FormGroupService', ['createFormGroup']);

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
});
