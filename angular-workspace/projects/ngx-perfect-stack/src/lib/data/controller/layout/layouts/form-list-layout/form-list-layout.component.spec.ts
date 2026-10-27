import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UntypedFormArray, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormListLayoutComponent } from './form-list-layout.component';
import { MetaEntityService } from '../../../../../meta/entity/meta-entity-service/meta-entity.service';
import { MetaPageService } from '../../../../../meta/page/meta-page-service/meta-page.service';
import { FormGroupService } from '../../../../data-edit/form-service/form-group.service';
import { EventService } from '../../../../../event/event.service';
import { ActivityTemplateService } from '../../../../data-service/activity-template.service';
import { MetaEntity } from '../../../../../domain/meta.entity';
import { MetaPage, Template, TemplateType } from '../../../../../domain/meta.page';
import { FormContext } from '../../../../data-edit/form-service/form.service';

describe('FormListLayoutComponent', () => {
  let component: FormListLayoutComponent;
  let fixture: ComponentFixture<FormListLayoutComponent>;
  let mockMetaEntityService: jasmine.SpyObj<MetaEntityService>;
  let mockMetaPageService: jasmine.SpyObj<MetaPageService>;
  let mockFormGroupService: jasmine.SpyObj<FormGroupService>;
  let mockEventService: jasmine.SpyObj<EventService>;
  let mockActivityTemplateService: jasmine.SpyObj<ActivityTemplateService>;

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

    await TestBed.configureTestingModule({
      declarations: [FormListLayoutComponent],
      providers: [
        { provide: MetaEntityService, useValue: mockMetaEntityService },
        { provide: MetaPageService, useValue: mockMetaPageService },
        { provide: FormGroupService, useValue: mockFormGroupService },
        { provide: EventService, useValue: mockEventService },
        { provide: ActivityTemplateService, useValue: mockActivityTemplateService },
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
    const template: Template = {
      metaEntityName: 'Activity',
      binding: 'activities',
      type: TemplateType.formList,
      templateHeading: '',
      action: 'AddActivity',
      cells: [],
      locations: {},
      styles: '',
      orderByName: '',
      orderByDir: '',
      noItemsHtml: '',
    };
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
    const template: Template = {
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
    };
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
});
