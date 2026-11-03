import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { Component, forwardRef, Input } from '@angular/core';
import { DateTimeControlComponent } from './date-time-control.component';
import { STACK_CONFIG } from '../../../../../ngx-perfect-stack-config';
import { CellAttribute } from '../../../../../meta/page/meta-page-service/meta-page.service';
import { AttributeType } from '../../../../../domain/meta.entity';

@Component({
  selector: 'app-date-picker-control',
  template: '',
  standalone: false,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MockDatePickerControlComponent),
      multi: true,
    },
  ],
})
class MockDatePickerControlComponent implements ControlValueAccessor {
  @Input() mode: any;
  @Input() attribute: any;
  @Input() includesTimeValue: any;
  @Input() idSuffix: any;

  writeValue(obj: any): void {}
  registerOnChange(fn: any): void {}
  registerOnTouched(fn: any): void {}
}

@Component({
  selector: 'lib-time-control',
  template: '',
  standalone: false,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MockTimeControlComponent),
      multi: true,
    },
  ],
})
class MockTimeControlComponent implements ControlValueAccessor {
  @Input() mode: any;
  @Input() cell: any;
  @Input() includesDate: any;
  @Input() idSuffix: any;

  writeValue(obj: any): void {}
  registerOnChange(fn: any): void {}
  registerOnTouched(fn: any): void {}
}

describe('DateTimeControlComponent', () => {
  let component: DateTimeControlComponent;
  let fixture: ComponentFixture<DateTimeControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [
        DateTimeControlComponent,
        MockDatePickerControlComponent,
        MockTimeControlComponent,
      ],
      providers: [
        {
          provide: STACK_CONFIG,
          useValue: {
            dateFormat: 'dd-MMM-yyyy',
            dateTimeFormat: 'dd-MMM-yyyy HH:mm',
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DateTimeControlComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should identify isDateOnly when component is DatePicker', () => {
    component.cell = {
      component: 'DatePicker',
      attributeName: 'event_begin_date',
      attribute: {
        type: AttributeType.DateTime,
        name: 'event_begin_date',
      },
    } as CellAttribute;

    expect(component.isDateOnly).toBeTrue();
  });

  it('should identify isDateOnly as false when component is default DateTime', () => {
    component.cell = {
      attributeName: 'event_begin_date',
      attribute: {
        type: AttributeType.DateTime,
        name: 'event_begin_date',
      },
    } as CellAttribute;

    expect(component.isDateOnly).toBeFalse();
  });

  it('should format view mode using dateFormat when isDateOnly is true', () => {
    const formGroup = new FormGroup({
      event_begin_date: new FormControl('2026-11-03T01:30:00Z'),
    });

    component.mode = 'view';
    component.formGroup = formGroup;
    component.name = 'event_begin_date';
    component.cell = {
      component: 'DatePicker',
      attributeName: 'event_begin_date',
      attribute: {
        type: AttributeType.DateTime,
        name: 'event_begin_date',
      },
    } as CellAttribute;

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.dateTimeValue).toBe('03-Nov-2026');
  });

  it('should format view mode using dateTimeFormat when isDateOnly is false', () => {
    const formGroup = new FormGroup({
      event_begin_date: new FormControl('2026-11-03T01:30:00Z'),
    });

    component.mode = 'view';
    component.formGroup = formGroup;
    component.name = 'event_begin_date';
    component.cell = {
      attributeName: 'event_begin_date',
      attribute: {
        type: AttributeType.DateTime,
        name: 'event_begin_date',
      },
    } as CellAttribute;

    component.ngOnInit();
    fixture.detectChanges();

    // In Pacific/Auckland (+13:00 daylight saving), 01:30 UTC is 14:30
    expect(component.dateTimeValue).toBe('03-Nov-2026 14:30');
  });

  it('should only render date picker with col-12 and no time control when isDateOnly is true in edit mode', () => {
    const formGroup = new FormGroup({
      event_begin_date: new FormControl(''),
    });

    component.mode = 'edit';
    component.formGroup = formGroup;
    component.name = 'event_begin_date';
    component.cell = {
      component: 'DatePicker',
      attributeName: 'event_begin_date',
      attribute: {
        type: AttributeType.DateTime,
        name: 'event_begin_date',
      },
    } as CellAttribute;

    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    const datePickerContainer = element.querySelector('.col-12');
    const timeControl = element.querySelector('lib-time-control');

    expect(datePickerContainer).toBeTruthy();
    expect(timeControl).toBeFalsy();
  });
});
