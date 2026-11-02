import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import {
  GeometryControlComponent,
  validateGeoJson,
  normalizeGeoJson,
  haversineDistance,
  calculateLineDistance,
  calculateRingArea,
  calculatePolygonArea,
  formatDistance,
  formatArea,
  getGeometrySummary,
} from './geometry-control.component';
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
      coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]],
    });
    expect(validateGeoJson(validPoly).valid).toBeTrue();

    const invalidRing = JSON.stringify({
      type: 'Polygon',
      coordinates: [[[0, 0], [1, 0], [0, 0]]],
    });
    expect(validateGeoJson(invalidRing).valid).toBeFalse();
  });

  it('should validate Feature and FeatureCollection', () => {
    const feature = JSON.stringify({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [174.77, -41.28] },
    });
    expect(validateGeoJson(feature).valid).toBeTrue();

    const fc = JSON.stringify({
      type: 'FeatureCollection',
      features: [],
    });
    expect(validateGeoJson(fc).valid).toBeTrue();
  });
});

describe('Geometry Calculations and Summaries', () => {
  describe('haversineDistance and calculateLineDistance', () => {
    it('should calculate distance between two known points accurately', () => {
      // Wellington to Auckland ~495 km
      const wellington = [174.7762, -41.2865];
      const auckland = [174.7633, -36.8485];
      const dist = haversineDistance(wellington, auckland);
      expect(dist).toBeGreaterThan(490000);
      expect(dist).toBeLessThan(500000);
    });

    it('should calculate cumulative line distance', () => {
      const line = [
        [174.7762, -41.2865],
        [174.7800, -41.2900],
        [174.7900, -41.3000],
      ];
      const dist = calculateLineDistance(line);
      expect(dist).toBeGreaterThan(1500);
      expect(dist).toBeLessThan(2500);
    });

    it('should return 0 for empty or single-point lines', () => {
      expect(calculateLineDistance([])).toBe(0);
      expect(calculateLineDistance([[174.77, -41.28]])).toBe(0);
    });
  });

  describe('calculateRingArea and calculatePolygonArea', () => {
    it('should calculate area of a spherical polygon', () => {
      // Small polygon in NZ ~ 1 km x 1 km (~ 1,000,000 m2)
      const ring = [
        [172.0, -44.0],
        [172.0125, -44.0],
        [172.0125, -44.009],
        [172.0, -44.009],
        [172.0, -44.0],
      ];
      const area = calculatePolygonArea([ring]);
      expect(area).toBeGreaterThan(900000);
      expect(area).toBeLessThan(1100000);
    });

    it('should return 0 for degenerate rings', () => {
      expect(calculatePolygonArea([])).toBe(0);
      expect(calculatePolygonArea([[[0, 0], [1, 1]]])).toBe(0);
    });
  });

  describe('formatDistance', () => {
    it('should format distances < 1 m with decimals', () => {
      expect(formatDistance(0.5)).toBe('0.5 m');
    });

    it('should format distances < 1,000 m as integer meters', () => {
      expect(formatDistance(450.4)).toBe('450 m');
      expect(formatDistance(999)).toBe('999 m');
    });

    it('should format distances >= 1,000 m in km', () => {
      expect(formatDistance(1000)).toBe('1.0 km');
      expect(formatDistance(2345)).toBe('2.3 km');
      expect(formatDistance(15600)).toBe('15.6 km');
    });
  });

  describe('formatArea', () => {
    it('should format areas < 1 m2 with decimal', () => {
      expect(formatArea(0.7)).toBe('0.7 m2');
    });

    it('should format areas < 10,000 m2 as integer m2', () => {
      expect(formatArea(680.2)).toBe('680 m2');
      expect(formatArea(9500)).toBe('9500 m2');
    });

    it('should format areas between 10,000 m2 and 1,000,000 m2 in ha', () => {
      expect(formatArea(10000)).toBe('1.0 ha');
      expect(formatArea(45000)).toBe('4.5 ha');
    });

    it('should format areas >= 1,000,000 m2 in km2', () => {
      expect(formatArea(1000000)).toBe('1.0 km2');
      expect(formatArea(12500000)).toBe('12.5 km2');
    });
  });

  describe('getGeometrySummary', () => {
    it('should generate Point summary with ~10m precision (4 decimals) and Lat before Lng', () => {
      const point = { type: 'Point', coordinates: [172.034567, -44.561234] };
      const summary = getGeometrySummary(point);
      expect(summary).toBeTruthy();
      expect(summary?.type).toBe('Point');
      expect(summary?.esriIcon).toBe('esri-icon-map-pin');
      expect(summary?.materialIcon).toBe('location_on');
      expect(summary?.textSummary).toBe('Lat: -44.5612, Lng: 172.0346');
      expect(summary?.tooltip).toContain('~10m precision');
    });

    it('should generate LineString summary with node count and distance', () => {
      const line = {
        type: 'LineString',
        coordinates: [
          [174.77, -41.28],
          [174.78, -41.29],
          [174.79, -41.30],
        ],
      };
      const summary = getGeometrySummary(line);
      expect(summary?.type).toBe('Line');
      expect(summary?.esriIcon).toBe('esri-icon-polyline');
      expect(summary?.textSummary).toContain('3 Nodes, Dist:');
      expect(summary?.tooltip).toContain('Great Circle distance');
    });

    it('should generate Polygon summary with node count and area', () => {
      const poly = {
        type: 'Polygon',
        coordinates: [
          [
            [172.0, -44.0],
            [172.0125, -44.0],
            [172.0125, -44.009],
            [172.0, -44.009],
            [172.0, -44.0],
          ],
        ],
      };
      const summary = getGeometrySummary(poly);
      expect(summary?.type).toBe('Polygon');
      expect(summary?.esriIcon).toBe('esri-icon-polygon');
      expect(summary?.textSummary).toContain('5 Nodes, Area:');
      expect(summary?.tooltip).toContain('Great Circle area');
    });

    it('should generate MultiLineString summary with line count, node count and total distance', () => {
      const multiLine = {
        type: 'MultiLineString',
        coordinates: [
          [[174.77, -41.28], [174.78, -41.29]],
          [[174.79, -41.30], [174.80, -41.31]],
        ],
      };
      const summary = getGeometrySummary(multiLine);
      expect(summary?.type).toBe('MultiLine');
      expect(summary?.textSummary).toContain('2 Lines, 4 Nodes, Dist:');
    });

    it('should generate MultiPolygon summary with polygon count, node count and total area', () => {
      const multiPoly = {
        type: 'MultiPolygon',
        coordinates: [
          [[[0, 0], [0.01, 0], [0.01, 0.01], [0, 0.01], [0, 0]]],
          [[[1, 1], [1.01, 1], [1.01, 1.01], [1, 1.01], [1, 1]]],
        ],
      };
      const summary = getGeometrySummary(multiPoly);
      expect(summary?.type).toBe('MultiPolygon');
      expect(summary?.textSummary).toContain('2 Polygons, 10 Nodes, Area:');
    });

    it('should unwrap Feature and summarize inner geometry', () => {
      const feature = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [172.03, -44.56] },
      };
      const summary = getGeometrySummary(feature);
      expect(summary?.type).toBe('Point');
      expect(summary?.textSummary).toBe('Lat: -44.5600, Lng: 172.0300');
    });
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

    it('should display user-readable summary when collapsed', () => {
      const geometry = { type: 'Point', coordinates: [174.77, -41.28] };
      component.writeValue(geometry);
      fixture.detectChanges();

      expect(component.isExpanded()).toBeFalse();
      const compiled = fixture.nativeElement as HTMLElement;
      const summaryEl = compiled.querySelector('.geometry-view-summary');
      expect(summaryEl).toBeTruthy();

      const badge = compiled.querySelector('[data-testid="badge-type-boundary"]');
      expect(badge?.textContent?.trim()).toBe('Point');

      const text = compiled.querySelector('[data-testid="summary-text-boundary"]');
      expect(text?.textContent?.trim()).toBe('Lat: -41.2800, Lng: 174.7700');
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
      const expandBtn = compiled.querySelector('[data-testid="expand-view-boundary"]');
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
