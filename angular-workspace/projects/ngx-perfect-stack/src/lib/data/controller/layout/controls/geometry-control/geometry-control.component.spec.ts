import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { GeometryControlComponent, validateGeoJson, normalizeGeoJson } from './geometry-control.component';
import { ToastService } from '../../../../../utils/toasts/toast.service';
import { CellAttribute } from '../../../../../meta/page/meta-page-service/meta-page.service';

describe('normalizeGeoJson', () => {
  it('should remove crs attribute and place type first', () => {
    const inputWithCrs = {
      crs: { type: 'name', properties: { name: 'EPSG:4326' } },
      coordinates: [174.77, -41.28],
      type: 'Point',
    };

    const normalized = normalizeGeoJson(inputWithCrs);
    const keys = Object.keys(normalized);
    expect(keys[0]).toBe('type');
    expect(keys[1]).toBe('coordinates');
    expect('crs' in normalized).toBeFalse();

    const jsonString = JSON.stringify(normalized);
    expect(jsonString).toBe('{"type":"Point","coordinates":[174.77,-41.28]}');
  });

  it('should recursively remove crs from nested features and order type first', () => {
    const featureWithCrs = {
      crs: { properties: { name: 'EPSG:4326' }, type: 'name' },
      properties: { name: 'Test' },
      geometry: {
        crs: { properties: { name: 'EPSG:4326' }, type: 'name' },
        coordinates: [100.0, 0.0],
        type: 'Point',
      },
      type: 'Feature',
    };

    const normalized = normalizeGeoJson(featureWithCrs);
    expect(Object.keys(normalized)[0]).toBe('type');
    expect(Object.keys(normalized.geometry)[0]).toBe('type');
    expect('crs' in normalized).toBeFalse();
    expect('crs' in normalized.geometry).toBeFalse();
  });
});

describe('validateGeoJson', () => {
  it('should accept null, undefined or empty string as valid null', () => {
    expect(validateGeoJson(null)).toEqual({ valid: true, parsed: null });
    expect(validateGeoJson(undefined)).toEqual({ valid: true, parsed: null });
    expect(validateGeoJson('')).toEqual({ valid: true, parsed: null });
    expect(validateGeoJson('   ')).toEqual({ valid: true, parsed: null });
  });

  it('should reject invalid JSON syntax', () => {
    const res = validateGeoJson('{ invalid: json');
    expect(res.valid).toBeFalse();
    expect(res.error).toContain('Invalid JSON syntax');
  });

  it('should reject non-object JSON values', () => {
    expect(validateGeoJson('123').valid).toBeFalse();
    expect(validateGeoJson('"a string"').valid).toBeFalse();
    expect(validateGeoJson('[1, 2, 3]').valid).toBeFalse();
  });

  it('should reject GeoJSON without type', () => {
    const res = validateGeoJson('{"coordinates": [10, 20]}');
    expect(res.valid).toBeFalse();
    expect(res.error).toContain('missing "type" property');
  });

  it('should reject unknown GeoJSON type', () => {
    const res = validateGeoJson('{"type": "InvalidType", "coordinates": [10, 20]}');
    expect(res.valid).toBeFalse();
    expect(res.error).toContain('Invalid GeoJSON type');
  });

  it('should validate Point GeoJSON correctly', () => {
    const validPoint = JSON.stringify({ type: 'Point', coordinates: [174.77, -41.28] });
    const res = validateGeoJson(validPoint);
    expect(res.valid).toBeTrue();
    expect(res.parsed.type).toBe('Point');

    const invalidPoint = JSON.stringify({ type: 'Point', coordinates: [174.77] });
    expect(validateGeoJson(invalidPoint).valid).toBeFalse();

    const nonNumericPoint = JSON.stringify({ type: 'Point', coordinates: ['foo', 'bar'] });
    expect(validateGeoJson(nonNumericPoint).valid).toBeFalse();
  });

  it('should validate LineString GeoJSON correctly', () => {
    const validLine = JSON.stringify({
      type: 'LineString',
      coordinates: [[174.77, -41.28], [174.78, -41.29]],
    });
    expect(validateGeoJson(validLine).valid).toBeTrue();

    const invalidLine = JSON.stringify({
      type: 'LineString',
      coordinates: [[174.77, -41.28]],
    });
    expect(validateGeoJson(invalidLine).valid).toBeFalse();
  });

  it('should validate Polygon GeoJSON correctly', () => {
    const validPoly = JSON.stringify({
      type: 'Polygon',
      coordinates: [
        [[174.77, -41.28], [174.78, -41.28], [174.78, -41.29], [174.77, -41.28]],
      ],
    });
    expect(validateGeoJson(validPoly).valid).toBeTrue();

    const invalidPoly = JSON.stringify({
      type: 'Polygon',
      coordinates: [
        [[174.77, -41.28], [174.78, -41.28]],
      ],
    });
    expect(validateGeoJson(invalidPoly).valid).toBeFalse();
  });

  it('should validate Feature and FeatureCollection', () => {
    const validFeature = JSON.stringify({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.0, 0.0] },
      properties: { prop0: 'value0' },
    });
    expect(validateGeoJson(validFeature).valid).toBeTrue();

    const validFeatureCollection = JSON.stringify({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [100.0, 0.0] },
          properties: {},
        },
      ],
    });
    expect(validateGeoJson(validFeatureCollection).valid).toBeTrue();
  });
});

describe('GeometryControlComponent', () => {
  let component: GeometryControlComponent;
  let fixture: ComponentFixture<GeometryControlComponent>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['showSuccess', 'showError']);

    await TestBed.configureTestingModule({
      declarations: [GeometryControlComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: ToastService, useValue: toastServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GeometryControlComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('View Mode', () => {
    beforeEach(() => {
      component.mode = 'view';
      component.cell = { attribute: { name: 'boundary' } } as CellAttribute;
    });

    it('should be readOnly in view mode', () => {
      expect(component.isReadOnly()).toBeTrue();
    });

    it('should display em-dash when value is empty', () => {
      component.writeValue(null);
      fixture.detectChanges();
      expect(component.hasValue()).toBeFalse();

      const compiled = fixture.nativeElement as HTMLElement;
      const emptyEl = compiled.querySelector('.empty-value');
      expect(emptyEl).toBeTruthy();
    });

    it('should display single-line truncated text when collapsed', () => {
      const geometry = { type: 'Point', coordinates: [174.77, -41.28] };
      component.writeValue(geometry);
      fixture.detectChanges();

      expect(component.isExpanded()).toBeFalse();
      const compiled = fixture.nativeElement as HTMLElement;
      const singleEl = compiled.querySelector('.geometry-view-single');
      expect(singleEl).toBeTruthy();
      expect(singleEl?.classList.contains('text-truncate')).toBeTrue();
      expect(singleEl?.textContent?.trim()).toBe(JSON.stringify(geometry));
    });

    it('should display multi-line preformatted text when expanded', () => {
      const geometry = { type: 'Point', coordinates: [174.77, -41.28] };
      component.writeValue(geometry);
      component.toggleExpanded();
      fixture.detectChanges();

      expect(component.isExpanded()).toBeTrue();
      const compiled = fixture.nativeElement as HTMLElement;
      const multiEl = compiled.querySelector('.geometry-view-multi');
      expect(multiEl).toBeTruthy();
      expect(multiEl?.textContent).toContain('{\n  "type": "Point"');
    });

    it('should strip crs attribute and order type first in singleLineText and multiLineText', () => {
      const geometryWithCrs = {
        crs: { type: 'name', properties: { name: 'EPSG:4326' } },
        coordinates: [174.77, -41.28],
        type: 'Point',
      };
      component.writeValue(geometryWithCrs);
      fixture.detectChanges();

      const single = component.singleLineText();
      expect(single).toBe('{"type":"Point","coordinates":[174.77,-41.28]}');
      expect(single.includes('"crs"')).toBeFalse();

      const multi = component.multiLineText();
      expect(multi).toBe(JSON.stringify({ type: 'Point', coordinates: [174.77, -41.28] }, null, 2));
      expect(multi.includes('"crs"')).toBeFalse();
    });

    it('should toggle expansion when clicking on view container', () => {
      const geometry = { type: 'Point', coordinates: [174.77, -41.28] };
      component.writeValue(geometry);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const container = compiled.querySelector('.geometry-view-container') as HTMLElement;
      expect(container).toBeTruthy();

      expect(component.isExpanded()).toBeFalse();
      container.click();
      fixture.detectChanges();
      expect(component.isExpanded()).toBeTrue();

      container.click();
      fixture.detectChanges();
      expect(component.isExpanded()).toBeFalse();
    });

    it('should have unfold_more icon when collapsed and unfold_less when expanded', () => {
      const geometry = { type: 'Point', coordinates: [174.77, -41.28] };
      component.writeValue(geometry);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const expandBtn = compiled.querySelector('[data-testid=\"expand-view-boundary\"]');
      expect(expandBtn?.textContent?.trim()).toBe('unfold_more');

      component.toggleExpanded();
      fixture.detectChanges();
      expect(expandBtn?.textContent?.trim()).toBe('unfold_less');
    });

    it('should position copy button as the rightmost button in view mode', () => {
      const geometry = { type: 'Point', coordinates: [174.77, -41.28] };
      component.writeValue(geometry);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('.geometry-action-buttons button');
      expect(buttons.length).toBe(2);
      expect(buttons[0].getAttribute('data-testid')).toBe('expand-view-boundary');
      expect(buttons[1].getAttribute('data-testid')).toBe('copy-view-boundary');
    });

    it('should copy text to clipboard when copy button clicked', async () => {
      const geometry = { type: 'Point', coordinates: [174.77, -41.28] };
      component.writeValue(geometry);
      fixture.detectChanges();

      spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
      await component.copyToClipboard();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(JSON.stringify(geometry));
      expect(toastServiceSpy.showSuccess).toHaveBeenCalled();
      expect(component.copied()).toBeTrue();
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.cell = { attribute: { name: 'boundary' } } as CellAttribute;
    });

    it('should not be readOnly in edit mode', () => {
      expect(component.isReadOnly()).toBeFalse();
    });

    it('should position copy button as the rightmost button in edit mode', () => {
      component.writeValue({ type: 'Point', coordinates: [10, 20] });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('.geometry-action-buttons button');
      expect(buttons.length).toBe(2);
      expect(buttons[0].getAttribute('data-testid')).toBe('format-edit-boundary');
      expect(buttons[1].getAttribute('data-testid')).toBe('copy-edit-boundary');
    });

    it('should display textarea with formatted JSON on writeValue', () => {
      const geometry = { type: 'Point', coordinates: [174.77, -41.28] };
      component.writeValue(geometry);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const textarea = compiled.querySelector('textarea') as HTMLTextAreaElement;
      expect(textarea).toBeTruthy();
      expect(textarea.value).toBe(JSON.stringify(geometry, null, 2));
    });

    it('should strip crs attribute when writeValue is called with an object containing crs', () => {
      const geometryWithCrs = {
        crs: { type: 'name', properties: { name: 'EPSG:4326' } },
        coordinates: [174.77, -41.28],
        type: 'Point',
      };
      component.writeValue(geometryWithCrs);
      fixture.detectChanges();

      const raw = component.rawText();
      expect(raw.includes('"crs"')).toBeFalse();
      expect(raw).toBe(JSON.stringify({ type: 'Point', coordinates: [174.77, -41.28] }, null, 2));
    });

    it('should update model and emit valid GeoJSON on input', () => {
      fixture.detectChanges();
      let emittedValue: any = null;
      component.registerOnChange((val: any) => {
        emittedValue = val;
      });

      const validText = '{"type":"Point","coordinates":[174.77,-41.28]}';
      component.onTextInput({ target: { value: validText } } as unknown as Event);

      expect(emittedValue).toEqual({ type: 'Point', coordinates: [174.77, -41.28] });
      expect(component.hasErrors()).toBeFalse();
      expect(component.validationError()).toBeNull();
    });

    it('should set validation error when invalid GeoJSON is entered', () => {
      fixture.detectChanges();
      let emittedValue: any = null;
      component.registerOnChange((val: any) => {
        emittedValue = val;
      });

      const invalidText = '{"type":"Point","coordinates":[174.77]}';
      component.onTextInput({ target: { value: invalidText } } as unknown as Event);

      expect(component.hasErrors()).toBeTrue();
      expect(component.validationError()).toContain('at least 2 numbers');
      expect(component.validationResult?.message).toContain('at least 2 numbers');
    });

    it('should format GeoJSON on button click and strip crs', () => {
      fixture.detectChanges();
      const inputWithCrs = '{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"coordinates":[174.77,-41.28],"type":"Point"}';
      component.onTextInput({ target: { value: inputWithCrs } } as unknown as Event);

      component.formatGeoJson();
      const formatted = component.rawText();
      expect(formatted.includes('"crs"')).toBeFalse();
      expect(formatted).toBe(JSON.stringify({ type: 'Point', coordinates: [174.77, -41.28] }, null, 2));
    });
  });
});
