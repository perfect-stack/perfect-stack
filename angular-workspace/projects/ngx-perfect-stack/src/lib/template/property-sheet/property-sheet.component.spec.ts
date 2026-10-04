import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PropertySheetComponent } from './property-sheet.component';
import { PropertySheetService, TemplatePropertyList } from './property-sheet.service';
import { MetaEntityService } from '../../meta/entity/meta-entity-service/meta-entity.service';
import { MetaPageService } from '../../meta/page/meta-page-service/meta-page.service';
import { of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('PropertySheetComponent', () => {
  let component: PropertySheetComponent;
  let fixture: ComponentFixture<PropertySheetComponent>;
  let propertySheetService: PropertySheetService;

  const mockMetaEntityService = {
    findAll: () => of([{ name: 'Person', attributes: [] }])
  };

  const mockMetaPageService = {
    findAll: () => of([{ name: 'Person.view_edit', templates: [] }])
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PropertySheetComponent],
      imports: [FormsModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        PropertySheetService,
        { provide: MetaEntityService, useValue: mockMetaEntityService },
        { provide: MetaPageService, useValue: mockMetaPageService },
      ]
    }).compileComponents();

    propertySheetService = TestBed.inject(PropertySheetService);
    fixture = TestBed.createComponent(PropertySheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h4')).toBeNull();
  });

  it('should display template properties when editWithType is called', async () => {
    const template = {
      binding: 'person',
      type: 'form',
      metaEntityName: 'Person'
    };

    propertySheetService.editWithType('Template', template, 'Template');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const titleEl = compiled.querySelector('h4');
    expect(titleEl).toBeTruthy();
    expect(titleEl?.textContent?.trim()).toBe('Properties');

    const propertyRows = compiled.querySelectorAll('.property-name');
    expect(propertyRows.length).toBeGreaterThan(0);
  });

  it('should update properties when a different edit event is emitted', async () => {
    const template = {
      binding: 'person',
      type: 'form',
      metaEntityName: 'Person'
    };

    propertySheetService.editWithType('Template', template, 'Template');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const cell = {
      width: '6',
      height: '1'
    };

    propertySheetService.editWithType('Cell', cell, 'Cell');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const titleEl = compiled.querySelector('h4');
    expect(titleEl?.textContent).toContain('Cell Properties');
  });
});
