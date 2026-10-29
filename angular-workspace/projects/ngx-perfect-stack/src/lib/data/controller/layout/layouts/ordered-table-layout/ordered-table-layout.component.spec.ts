import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { UntypedFormArray, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { OrderedTableLayoutComponent } from './ordered-table-layout.component';
import { MetaEntityService } from '../../../../../meta/entity/meta-entity-service/meta-entity.service';
import { FormService } from '../../../../data-edit/form-service/form.service';
import { FormGroupService } from '../../../../data-edit/form-service/form-group.service';
import { DebugService } from '../../../../../utils/debug/debug.service';
import { DataService } from '../../../../data-service/data.service';
import { Template, TemplateType } from '../../../../../domain/meta.page';

describe('OrderedTableLayoutComponent', () => {
  let component: OrderedTableLayoutComponent;
  let fixture: ComponentFixture<OrderedTableLayoutComponent>;
  let mockDataService: jasmine.SpyObj<DataService>;

  beforeEach(async () => {
    const mockMetaEntityService = jasmine.createSpyObj<MetaEntityService>('MetaEntityService', [], {
      metaEntityMap$: of(new Map()),
    });
    mockDataService = jasmine.createSpyObj<DataService>('DataService', ['reorder']);
    mockDataService.reorder.and.returnValue(of(undefined as any));
    const mockRouter = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    const mockFormService = jasmine.createSpyObj<FormService>('FormService', ['toCellAttributeArray']);
    const mockFormGroupService = jasmine.createSpyObj<FormGroupService>('FormGroupService', ['createFormGroup']);

    await TestBed.configureTestingModule({
      declarations: [OrderedTableLayoutComponent],
      providers: [
        { provide: MetaEntityService, useValue: mockMetaEntityService },
        { provide: DataService, useValue: mockDataService },
        { provide: Router, useValue: mockRouter },
        { provide: FormService, useValue: mockFormService },
        { provide: FormGroupService, useValue: mockFormGroupService },
        { provide: DebugService, useValue: { ON: false } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderedTableLayoutComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should handle onDrop by moving control, re-indexing sort_index, and calling dataService.reorder', () => {
    const template: Template = {
      metaEntityName: 'Item',
      binding: 'items',
      type: TemplateType.orderedTable,
      templateHeading: '',
      cells: [],
      locations: {},
      styles: '',
      orderByName: 'sort_index',
      orderByDir: '',
      noItemsHtml: '',
    };
    component.template = template;
    component.relationshipProperty = 'items';

    const row0 = new UntypedFormGroup({
      id: new UntypedFormControl('id-0'),
      name: new UntypedFormControl('First'),
      sort_index: new UntypedFormControl(0),
    });
    const row1 = new UntypedFormGroup({
      id: new UntypedFormControl('id-1'),
      name: new UntypedFormControl('Second'),
      sort_index: new UntypedFormControl(1),
    });
    const row2 = new UntypedFormGroup({
      id: new UntypedFormControl('id-2'),
      name: new UntypedFormControl('Third'),
      sort_index: new UntypedFormControl(2),
    });

    component.formGroup = new UntypedFormGroup({
      items: new UntypedFormArray([row0, row1, row2]),
    });

    // Move item at index 0 to index 2
    component.onDrop({
      previousIndex: 0,
      currentIndex: 2,
    } as any);

    // Order should now be row1, row2, row0
    const formArray = component.attributes!;
    expect(formArray.at(0).get('id')?.value).toBe('id-1');
    expect(formArray.at(0).get('sort_index')?.value).toBe(0);

    expect(formArray.at(1).get('id')?.value).toBe('id-2');
    expect(formArray.at(1).get('sort_index')?.value).toBe(1);

    expect(formArray.at(2).get('id')?.value).toBe('id-0');
    expect(formArray.at(2).get('sort_index')?.value).toBe(2);

    expect(mockDataService.reorder).toHaveBeenCalledWith('Item', ['id-1', 'id-2', 'id-0']);
  });
});
