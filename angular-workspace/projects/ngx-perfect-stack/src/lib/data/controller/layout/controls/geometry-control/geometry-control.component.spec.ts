import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { GeometryControlComponent, validateGeoJson } from './geometry-control.component';
import { ToastService } from '../../../../../utils/toasts/toast.service';
import { CellAttribute } from '../../../../../meta/page/meta-page-service/meta-page.service';

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
    component.cell = {
      attribute: {
        name: 'boundary',
        label: 'Boundary',
        type: 'Geometry',
      },
    } as unknown as CellAttribute;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.attributeName()).toBe('boundary');
  });

  describe('View mode', () => {
    beforeEach(() => {
      component.mode = 'view';
    });

    it('should show empty dash if no value is set', () => {
      component.writeValue(null);
      fixture.detectChanges();

      expect(component.hasValue()).toBeFalse();
      expect(component.isReadOnly()).toBeTrue();
      const el: HTMLElement = fixture.nativeElement;
      const emptyEl = el.querySelector('.empty-value');
      expect(emptyEl).toBeTruthy();
      expect(emptyEl?.textContent).toContain('—');
    });

    it('should display compact single-line GeoJSON by default', () => {
      const point = { type: 'Point', coordinates: [174.77, -41.28] };
      component.writeValue(point);
      fixture.detectChanges();

      expect(component.hasValue()).toBeTrue();
      expect(component.isExpanded()).toBeFalse();

      const el: HTMLElement = fixture.nativeElement;
      const singleEl = el.querySelector('.geometry-view-single');
      expect(singleEl).toBeTruthy();
      expect(singleEl?.textContent?.trim()).toBe(JSON.stringify(point));
    });

    it('should toggle twisty between single line and multi-line', () => {
      const point = { type: 'Point', coordinates: [174.77, -41.28] };
      component.writeValue(point);
      fixture.detectChanges();

      expect(component.isExpanded()).toBeFalse();
      component.toggleExpanded();
      expect(component.isExpanded()).toBeTrue();
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const multiEl = el.querySelector('.geometry-view-multi');
      expect(multiEl).toBeTruthy();
      expect(multiEl?.textContent).toContain(JSON.stringify(point, null, 2));

      component.toggleExpanded();
      expect(component.isExpanded()).toBeFalse();
      fixture.detectChanges();
      expect(el.querySelector('.geometry-view-single')).toBeTruthy();
    });

    it('should copy GeoJSON to clipboard and show toast', async () => {
      const point = { type: 'Point', coordinates: [174.77, -41.28] };
      component.writeValue(point);
      fixture.detectChanges();

      spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());

      await component.copyToClipboard();
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(JSON.stringify(point));
      expect(toastServiceSpy.showSuccess).toHaveBeenCalledWith('GeoJSON copied to clipboard');
      expect(component.copied()).toBeTrue();
    });
  });

  describe('Edit mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
    });

    it('should render textarea with formatted GeoJSON value', () => {
      const point = { type: 'Point', coordinates: [174.77, -41.28] };
      component.writeValue(point);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const textarea = el.querySelector('textarea.geometry-textarea') as HTMLTextAreaElement;
      expect(textarea).toBeTruthy();
      expect(textarea.value).toBe(JSON.stringify(point, null, 2));
    });

    it('should emit parsed geometry when valid GeoJSON is typed', () => {
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

    it('should format GeoJSON on button click', () => {
      fixture.detectChanges();
      const compactText = '{"type":"Point","coordinates":[174.77,-41.28]}';
      component.onTextInput({ target: { value: compactText } } as unknown as Event);

      component.formatGeoJson();
      expect(component.rawText()).toBe(JSON.stringify({ type: 'Point', coordinates: [174.77, -41.28] }, null, 2));
    });
  });
});
