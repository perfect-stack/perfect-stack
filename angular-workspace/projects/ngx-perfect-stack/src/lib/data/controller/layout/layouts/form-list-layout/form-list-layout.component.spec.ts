import '@angular/localize/init';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UntypedFormArray, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormListLayoutComponent } from './form-list-layout.component';
import { MetaEntityService } from '../../../../../meta/entity/meta-entity-service/meta-entity.service';
import { MetaPageService } from '../../../../../meta/page/meta-page-service/meta-page.service';
import { FormGroupService } from '../../../../data-edit/form-service/form-group.service';
import { EventService } from '../../../../../event/event.service';
import { ActivityTemplateService } from '../../../../data-service/activity-template.service';
import { MetaPage, Template, TemplateType } from '../../../../../domain/meta.page';
import { FormContext } from '../../../../data-edit/form-service/form.service';
import { MapEditCoordinatorService } from '../../tool-view/map-tool/map-edit-coordinator.service';

describe('FormListLayoutComponent', () => {
  let component: FormListLayoutComponent;
  let fixture: ComponentFixture<FormListLayoutComponent>;
  let mockMetaEntityService: jasmine.SpyObj<MetaEntityService>;
  let mockMetaPageService: jasmine.SpyObj<MetaPageService>;
  let mockFormGroupService: jasmine.SpyObj<FormGroupService>;
  let mockEventService: jasmine.SpyObj<EventService>;
  let mockActivityTemplateService: jasmine.SpyObj<ActivityTemplateService>;
  let mapCoordinator: MapEditCoordinatorService;

  const createTemplate = (overrides: Partial<Template> = {}): Template => ({
    metaEntityName: 'Occurrence',
    binding: 'occurrences',
    type: TemplateType.formList,
    templateHeading: '',
    cells: [],
    locations: {},
    styles: '',
    orderByName: '',
    orderByDir: '',
    noItemsHtml: '',
    ...overrides,
  });

  const createOccurrenceFormArray = (count: number): UntypedFormArray =>
    new UntypedFormArray(
      Array.from({ length: count }, (_, idx) =>
        new UntypedFormGroup({
          record_number: new UntypedFormControl(`REC-${idx + 1}`),
        })
      )
    );

  beforeEach(async () => {
    mockMetaEntityService = jasmine.createSpyObj<MetaEntityService>('MetaEntityService', [], {
      metaEntityMap$: of(new Map()),
    });
    mockMetaPageService = jasmine.createSpyObj<MetaPageService>('MetaPageService', [], {
      metaPageMap$: of(new Map()),
    });
    mockFormGroupService = jasmine.createSpyObj<FormGroupService>('FormGroupService', ['createFormGroup']);
    mockEventService = jasmine.createSpyObj<EventService>('EventService', ['dispatchOnAction']);
    mockActivityTemplateService = jasmine.createSpyObj<ActivityTemplateService>('ActivityTemplateService', [
      'getActivityTemplate',
      'getSynchronous',
    ]);
    mockActivityTemplateService.getActivityTemplate.and.returnValue(of(null));
    mapCoordinator = new MapEditCoordinatorService();

    await TestBed.configureTestingModule({
      declarations: [FormListLayoutComponent],
      imports: [NgbPaginationModule],
      providers: [
        { provide: MetaEntityService, useValue: mockMetaEntityService },
        { provide: MetaPageService, useValue: mockMetaPageService },
        { provide: FormGroupService, useValue: mockFormGroupService },
        { provide: EventService, useValue: mockEventService },
        { provide: ActivityTemplateService, useValue: mockActivityTemplateService },
        { provide: MapEditCoordinatorService, useValue: mapCoordinator },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(FormListLayoutComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should dispatch onAction when template.action is configured on onAddRow', () => {
    const template = createTemplate({
      metaEntityName: 'Activity',
      binding: 'activities',
      action: 'AddActivity',
    });
    component.template = template;
    component.mode = 'edit';
    component.relationshipProperty = 'activities';
    const formArray = new UntypedFormArray([]);
    component.formGroup = new UntypedFormGroup({
      activities: formArray,
    });
    const metaPage: MetaPage = {
      name: 'CaptureEvent.view_edit',
      title: 'Capture Event',
      type: {} as any,
      layoutStyle: {} as any,
      dataQueryList: [],
      controllers: [],
      templates: [],
    };
    component.ctx = {
      metaPage: metaPage,
      metaPageMap: new Map(),
      metaEntityMap: new Map(),
    } as unknown as FormContext;

    component.onAddRow();

    expect(mockEventService.dispatchOnAction).toHaveBeenCalledWith(
      'CaptureEvent.view_edit',
      'activities',
      component.ctx,
      'AddActivity',
      jasmine.objectContaining({
        formGroup: component.formGroup,
        formArray: formArray,
        template: template,
      })
    );
    expect(mockFormGroupService.createFormGroup).not.toHaveBeenCalled();
  });

  it('should create formGroup directly when template.action is NOT configured on onAddRow', () => {
    const template = createTemplate();
    component.template = template;
    component.mode = 'edit';
    component.relationshipProperty = 'occurrences';
    const formArray = new UntypedFormArray([]);
    component.formGroup = new UntypedFormGroup({
      occurrences: formArray,
    });
    mockFormGroupService.createFormGroup.and.returnValue(new UntypedFormGroup({}));

    component.onAddRow();

    expect(mockEventService.dispatchOnAction).not.toHaveBeenCalled();
    expect(mockFormGroupService.createFormGroup).toHaveBeenCalled();
    expect(formArray.length).toBe(1);
  });

  it('should return item title from activity_template_name or activity_template_id', () => {
    const formArray = new UntypedFormArray([
      new UntypedFormGroup({
        activity_template_name: new UntypedFormControl('Five Minute Bird Count'),
      }),
      new UntypedFormGroup({
        activity_template_id: new UntypedFormControl('tmpl-1'),
      }),
    ]);
    component.formGroup = new UntypedFormGroup({
      activities: formArray,
    });
    component.relationshipProperty = 'activities';

    mockActivityTemplateService.getSynchronous.and.callFake((id: string) => {
      if (id === 'tmpl-1') {
        return { activity_template_name: 'Acoustic Monitoring' };
      }
      return null;
    });

    expect(component.getItemTitle(0)).toBe('Five Minute Bird Count');
    expect(component.getItemTitle(1)).toBe('Acoustic Monitoring');
  });

  it('should generate unique row id suffixes for repeated child items', () => {
    component.relationshipProperty = 'occurrences';
    expect(component.getRowIdSuffix(0)).toBe('occurrences_0');
    expect(component.getRowIdSuffix(1)).toBe('occurrences_1');
  });

  it('should combine parent idSuffix with child relationshipProperty and index for nested child items', () => {
    component.idSuffix = 'occurrences_0';
    component.relationshipProperty = 'activities';
    expect(component.getRowIdSuffix(0)).toBe('occurrences_0_activities_0');
    expect(component.getRowIdSuffix(1)).toBe('occurrences_0_activities_1');
  });

  describe('client-side pagination', () => {
    it('should render all rows without pagination controls when template.pageSize is not set', () => {
      component.template = createTemplate();
      component.mode = 'view';
      component.relationshipProperty = 'occurrences';
      component.formGroup = new UntypedFormGroup({
        occurrences: createOccurrenceFormArray(12),
      });

      fixture.detectChanges();

      const cards = fixture.nativeElement.querySelectorAll('.form-list-card');
      expect(cards.length).toBe(12);
      expect(fixture.nativeElement.querySelector('[data-testid="form-list-pagination-top"]')).toBeNull();
      expect(fixture.nativeElement.querySelector('[data-testid="form-list-pagination-bottom"]')).toBeNull();
    });

    it('should hide pagination controls when totalCount <= template.pageSize', () => {
      component.template = createTemplate({ pageSize: 10 });
      component.mode = 'view';
      component.relationshipProperty = 'occurrences';
      component.formGroup = new UntypedFormGroup({
        occurrences: createOccurrenceFormArray(10),
      });

      fixture.detectChanges();

      const cards = fixture.nativeElement.querySelectorAll('.form-list-card');
      expect(cards.length).toBe(10);
      expect(component.showPagination).toBeFalse();
      expect(fixture.nativeElement.querySelector('[data-testid="form-list-pagination-top"]')).toBeNull();
    });

    it('should slice rendered cards by pageSize and preserve true 0-based indices across pages', () => {
      component.template = createTemplate({ pageSize: 10 });
      component.mode = 'edit';
      component.relationshipProperty = 'occurrences';
      component.formGroup = new UntypedFormGroup({
        occurrences: createOccurrenceFormArray(25),
      });

      fixture.detectChanges();

      // Page 1: cards 0..9 (#1..#10)
      let cards = fixture.nativeElement.querySelectorAll('.form-list-card') as NodeListOf<HTMLElement>;
      expect(cards.length).toBe(10);
      expect(cards[0].id).toBe('occurrence-card-0');
      expect(cards[9].id).toBe('occurrence-card-9');
      expect(cards[0].textContent).toContain('#1 ');
      expect(cards[9].textContent).toContain('#10 ');
      expect(fixture.nativeElement.querySelector('[data-testid="form-list-pagination-summary"]').textContent).toContain(
        'Showing 1 - 10 of 25'
      );

      // Switch to Page 2: cards 10..19 (#11..#20)
      component.onPageChange(2);
      fixture.detectChanges();

      cards = fixture.nativeElement.querySelectorAll('.form-list-card') as NodeListOf<HTMLElement>;
      expect(cards.length).toBe(10);
      expect(cards[0].id).toBe('occurrence-card-10');
      expect(cards[9].id).toBe('occurrence-card-19');
      expect(cards[0].textContent).toContain('#11 ');
      expect(cards[9].textContent).toContain('#20 ');
      expect(fixture.nativeElement.querySelector('[data-testid="btn-delete-row-10"]')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('[data-testid="form-list-pagination-summary"]').textContent).toContain(
        'Showing 11 - 20 of 25'
      );

      // Switch to Page 3: cards 20..24 (#21..#25)
      component.onPageChange(3);
      fixture.detectChanges();

      cards = fixture.nativeElement.querySelectorAll('.form-list-card') as NodeListOf<HTMLElement>;
      expect(cards.length).toBe(5);
      expect(cards[0].id).toBe('occurrence-card-20');
      expect(cards[4].id).toBe('occurrence-card-24');
      expect(fixture.nativeElement.querySelector('[data-testid="form-list-pagination-summary"]').textContent).toContain(
        'Showing 21 - 25 of 25'
      );
    });

    it('should clamp currentPage when deleting the last item on the final page', () => {
      component.template = createTemplate({ pageSize: 10 });
      component.mode = 'edit';
      component.relationshipProperty = 'occurrences';
      const occArray = createOccurrenceFormArray(21);
      component.formGroup = new UntypedFormGroup({
        occurrences: occArray,
      });

      fixture.detectChanges();
      component.onPageChange(3);
      fixture.detectChanges();

      expect(component.currentPage).toBe(3);
      expect(fixture.nativeElement.querySelectorAll('.form-list-card').length).toBe(1);

      component.onDeleteRow(20);
      fixture.detectChanges();

      expect(occArray.length).toBe(20);
      expect(component.currentPage).toBe(2);
      const cards = fixture.nativeElement.querySelectorAll('.form-list-card') as NodeListOf<HTMLElement>;
      expect(cards.length).toBe(10);
      expect(cards[0].id).toBe('occurrence-card-10');
      expect(cards[9].id).toBe('occurrence-card-19');
    });

    it('should navigate to the last page when adding a new row', () => {
      component.template = createTemplate({ pageSize: 10 });
      component.mode = 'edit';
      component.relationshipProperty = 'occurrences';
      const occArray = createOccurrenceFormArray(20);
      component.formGroup = new UntypedFormGroup({
        occurrences: occArray,
      });
      mockFormGroupService.createFormGroup.and.returnValue(
        new UntypedFormGroup({ record_number: new UntypedFormControl('REC-21') })
      );

      fixture.detectChanges();
      expect(component.currentPage).toBe(1);

      component.onAddRow();
      fixture.detectChanges();

      expect(occArray.length).toBe(21);
      expect(component.currentPage).toBe(3);
      const cards = fixture.nativeElement.querySelectorAll('.form-list-card') as NodeListOf<HTMLElement>;
      expect(cards.length).toBe(1);
      expect(cards[0].id).toBe('occurrence-card-20');
    });

    it('should switch to the target page and scroll when mapCoordinator.focusCard$ emits an index on another page', () => {
      spyOn(mapCoordinator, 'scrollElementIntoViewBelowMap');
      component.template = createTemplate({ pageSize: 10 });
      component.mode = 'view';
      component.relationshipProperty = 'occurrences';
      component.formGroup = new UntypedFormGroup({
        occurrences: createOccurrenceFormArray(25),
      });

      fixture.detectChanges();
      expect(component.currentPage).toBe(1);

      mapCoordinator.focusCard(22);

      expect(component.currentPage).toBe(3);
      expect(component.highlightedIndex).toBe(22);
      const focusedCard = fixture.nativeElement.querySelector('#occurrence-card-22') as HTMLElement | null;
      expect(focusedCard).not.toBeNull();
      expect(mapCoordinator.scrollElementIntoViewBelowMap).toHaveBeenCalledWith(focusedCard);
    });
  });
});
