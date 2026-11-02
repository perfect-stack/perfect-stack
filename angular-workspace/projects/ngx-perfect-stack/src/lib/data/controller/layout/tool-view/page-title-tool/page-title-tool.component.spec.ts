import {ComponentFixture, TestBed} from '@angular/core/testing';
import {PageTitleToolComponent} from './page-title-tool.component';
import {PropertySheetService} from '../../../../../template/property-sheet/property-sheet.service';
import {MetaPageService} from '../../../../../meta/page/meta-page-service/meta-page.service';
import {FormContext} from '../../../../data-edit/form-service/form.service';
import {FormControl, FormGroup} from '@angular/forms';
import {MetaEntity} from '../../../../../domain/meta.entity';
import {MetaPage, PageType} from '../../../../../domain/meta.page';

describe('PageTitleToolComponent', () => {
  let component: PageTitleToolComponent;
  let fixture: ComponentFixture<PageTitleToolComponent>;
  let propertySheetServiceSpy: jasmine.SpyObj<PropertySheetService>;

  beforeEach(async () => {
    propertySheetServiceSpy = jasmine.createSpyObj('PropertySheetService', ['edit']);

    await TestBed.configureTestingModule({
      declarations: [PageTitleToolComponent],
      providers: [
        { provide: PropertySheetService, useValue: propertySheetServiceSpy },
        { provide: MetaPageService, useValue: null },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PageTitleToolComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Entity Name casing', () => {
    it('should format entityNameSingular in Title Case with spaces', () => {
      component.ctx = {
        metaEntity: {
          name: 'CaptureEvent',
          pluralName: 'Capture Events',
        } as MetaEntity,
      } as FormContext;

      expect(component.entityNameSingular).toBe('Capture Event');
      expect(component.entityNamePlural).toBe('Capture Events');
    });

    it('should display "Add Capture Event" when adding a new entity', () => {
      const formGroup = new FormGroup({
        id: new FormControl(null),
      });
      const formMap = new Map<string, any>();
      formMap.set('capture_event', formGroup);

      component.ctx = {
        mode: 'edit',
        metaPage: {
          title: '$PageTitle',
          type: PageType.view_edit,
        } as MetaPage,
        metaEntity: {
          name: 'CaptureEvent',
          pluralName: 'Capture Events',
        } as MetaEntity,
        formMap,
      } as FormContext;

      component.pageTitleTool = {
        type: 'PageTitle' as any,
        nameAttributes: '',
      } as any;

      fixture.detectChanges();

      const titleEl = fixture.nativeElement.querySelector('[data-testid="page-title"]');
      expect(titleEl).toBeTruthy();
      expect(titleEl.textContent.trim()).toBe('Add Capture Event');
    });
  });
});
