import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, FormsModule, NgControl } from '@angular/forms';
import { of } from 'rxjs';
import { EnumerationControlComponent } from './enumeration-control.component';
import { STACK_CONFIG } from '../../../../../ngx-perfect-stack-config';
import { DataService } from '../../../../data-service/data.service';
import { AttributeType, MetaAttribute } from '../../../../../domain/meta.entity';
import { CellAttribute } from '../../../../../meta/page/meta-page-service/meta-page.service';

describe('EnumerationControlComponent', () => {
  let component: EnumerationControlComponent;
  let fixture: ComponentFixture<EnumerationControlComponent>;
  let mockDataService: jasmine.SpyObj<DataService>;

  beforeEach(async () => {
    mockDataService = jasmine.createSpyObj('DataService', ['findById']);

    await TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [EnumerationControlComponent],
      providers: [
        {
          provide: NgControl,
          useValue: {
            name: 'event_type',
            control: new FormControl(''),
            valueAccessor: null,
          },
        },
        {
          provide: STACK_CONFIG,
          useValue: {
            dataSourceEditable: true,
          },
        },
        {
          provide: DataService,
          useValue: mockDataService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EnumerationControlComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load options from attribute.enumeration if provided', () => {
    component.attribute = {
      name: 'status',
      type: AttributeType.Enumeration,
      enumeration: ['Draft', 'Active', 'Archived'],
    } as MetaAttribute;

    component.ngOnInit();
    expect(component.options).toEqual(['Draft', 'Active', 'Archived']);
  });

  it('should resolve dependsOn ManyToOne control and populate options from pipe-delimited event_type_options', () => {
    const methodControl = new FormControl('method-uuid-123') as any;
    methodControl.attribute = {
      name: 'method',
      type: AttributeType.ManyToOne,
      relationshipTarget: 'Method',
    };

    const formGroup = new FormGroup({
      method_id: methodControl,
      event_type: new FormControl(''),
    });

    component.formGroup = formGroup;
    component.cell = {
      attributeName: 'event_type',
      dependsOn: 'method',
      secondaryAttributeName: 'event_type_options',
    } as CellAttribute;

    mockDataService.findById.and.returnValue(
      of({
        id: 'method-uuid-123',
        method_name: 'Bird Capture',
        event_type_options: 'Capture | Recapture | Banding | Observation',
      })
    );

    component.ngOnInit();

    expect(mockDataService.findById).toHaveBeenCalledWith('Method', 'method-uuid-123');
    expect(component.options).toEqual(['Capture', 'Recapture', 'Banding', 'Observation']);
  });

  it('should clear selectedOption when new options do not contain it', () => {
    let emittedValue: any = 'INIT';
    component.registerOnChange((val: any) => {
      emittedValue = val;
    });

    const methodControl = new FormControl('method-uuid-123') as any;
    methodControl.attribute = {
      name: 'method',
      type: AttributeType.ManyToOne,
      relationshipTarget: 'Method',
    };

    const formGroup = new FormGroup({
      method_id: methodControl,
      event_type: new FormControl('OldValue'),
    });

    component.formGroup = formGroup;
    component.selectedOption = 'OldValue';
    component.cell = {
      attributeName: 'event_type',
      dependsOn: 'method',
      secondaryAttributeName: 'event_type_options',
    } as CellAttribute;

    mockDataService.findById.and.returnValue(
      of({
        id: 'method-uuid-123',
        event_type_options: 'Capture | Recapture',
      })
    );

    component.ngOnInit();

    expect(component.selectedOption).toBeNull();
    expect(emittedValue).toBeNull();
  });

  it('should retain selectedOption when new options contain it', () => {
    const methodControl = new FormControl('method-uuid-123') as any;
    methodControl.attribute = {
      name: 'method',
      type: AttributeType.ManyToOne,
      relationshipTarget: 'Method',
    };

    const formGroup = new FormGroup({
      method_id: methodControl,
      event_type: new FormControl('Capture'),
    });

    component.formGroup = formGroup;
    component.selectedOption = 'Capture';
    component.cell = {
      attributeName: 'event_type',
      dependsOn: 'method',
      secondaryAttributeName: 'event_type_options',
    } as CellAttribute;

    mockDataService.findById.and.returnValue(
      of({
        id: 'method-uuid-123',
        event_type_options: 'Capture | Recapture',
      })
    );

    component.ngOnInit();

    expect(component.selectedOption).toBe('Capture');
  });

  it('should re-fetch options when dependent control changes value', () => {
    const methodControl = new FormControl('method-1') as any;
    methodControl.attribute = {
      name: 'method',
      type: AttributeType.ManyToOne,
      relationshipTarget: 'Method',
    };

    const formGroup = new FormGroup({
      method_id: methodControl,
      event_type: new FormControl(''),
    });

    component.formGroup = formGroup;
    component.cell = {
      attributeName: 'event_type',
      dependsOn: 'method',
      secondaryAttributeName: 'event_type_options',
    } as CellAttribute;

    mockDataService.findById.and.callFake((entity: string, id: string) => {
      if (id === 'method-1') {
        return of({ id: 'method-1', event_type_options: 'Option A | Option B' });
      } else {
        return of({ id: 'method-2', event_type_options: 'Option X | Option Y' });
      }
    });

    component.ngOnInit();
    expect(component.options).toEqual(['Option A', 'Option B']);

    methodControl.setValue('method-2');
    expect(component.options).toEqual(['Option X', 'Option Y']);
  });
});
