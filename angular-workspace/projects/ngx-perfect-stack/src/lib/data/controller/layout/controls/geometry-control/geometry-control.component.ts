import {ChangeDetectorRef, Component, computed, Input, OnInit, Optional, signal, WritableSignal} from '@angular/core';
import {ControlValueAccessor, NgControl, UntypedFormGroup} from '@angular/forms';
import {CellAttribute} from '../../../../../meta/page/meta-page-service/meta-page.service';
import {MetaAttribute} from '../../../../../domain/meta.entity';
import {FormControlWithAttribute} from '../../../../data-edit/form-service/form.service';
import {ResultType, ValidationResult} from '../../../../../domain/meta.rule';
import {ToastService} from '../../../../../utils/toasts/toast.service';

export interface GeoJsonValidationResult {
  valid: boolean;
  error?: string;
  parsed?: any;
}

export interface GeometrySummary {
  type: string;
  esriIcon: string;
  materialIcon: string;
  textSummary: string;
  tooltip: string;
}

const VALID_GEOMETRY_TYPES = [
  'Point',
  'MultiPoint',
  'LineString',
  'MultiLineString',
  'Polygon',
  'MultiPolygon',
  'GeometryCollection',
];

const VALID_GEOJSON_TYPES = [
  ...VALID_GEOMETRY_TYPES,
  'Feature',
  'FeatureCollection',
];

export const EARTH_RADIUS_METERS = 6371008.8;

/**
 * Calculates Great Circle distance between two [lng, lat] coordinates in meters using the Haversine formula.
 */
export function haversineDistance(p1: number[], p2: number[]): number {
  if (!p1 || !p2 || p1.length < 2 || p2.length < 2) {
    return 0;
  }
  const [lng1, lat1] = p1;
  const [lng2, lat2] = p2;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

/**
 * Calculates the total Great Circle distance of a line in meters.
 */
export function calculateLineDistance(coordinates: number[][]): number {
  if (!coordinates || coordinates.length < 2) {
    return 0;
  }
  let total = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    total += haversineDistance(coordinates[i], coordinates[i + 1]);
  }
  return total;
}

/**
 * Calculates the geodesic area of a closed linear ring on a WGS 84 sphere in square meters.
 */
export function calculateRingArea(ring: number[][]): number {
  if (!ring || ring.length < 3) {
    return 0;
  }
  const rad = Math.PI / 180;
  let total = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const p1 = ring[i];
    const p2 = ring[i + 1];
    total += (p2[0] - p1[0]) * rad * (2 + Math.sin(p1[1] * rad) + Math.sin(p2[1] * rad));
  }
  return Math.abs((total * EARTH_RADIUS_METERS * EARTH_RADIUS_METERS) / 2);
}

/**
 * Calculates the geodesic area of a polygon (exterior ring minus interior rings / holes) in square meters.
 */
export function calculatePolygonArea(rings: number[][][]): number {
  if (!rings || rings.length === 0) {
    return 0;
  }
  let area = calculateRingArea(rings[0]);
  for (let i = 1; i < rings.length; i++) {
    area -= calculateRingArea(rings[i]);
  }
  return Math.max(0, area);
}

/**
 * Formats distance in meters:
 * - If < 1 m: decimal points of 1 m (e.g. 0.8 m)
 * - If < 1,000 m: integer meters (e.g. 450 m)
 * - If >= 1,000 m: kilometers with 1 decimal (e.g. 2.3 km)
 */
export function formatDistance(meters: number): string {
  if (meters < 1) {
    return `${meters.toFixed(1)} m`;
  }
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = meters / 1000;
  return `${km.toFixed(1)} km`;
}

/**
 * Formats area in square meters:
 * - If < 1 m2: decimal points of 1 m2
 * - If < 10,000 m2: m2 (e.g. 680 m2)
 * - If 10,000 m2 <= area < 1,000,000 m2: ha (e.g. 2.4 ha)
 * - If >= 1,000,000 m2: km2 (e.g. 12.3 km2)
 */
export function formatArea(sqMeters: number): string {
  if (sqMeters < 1) {
    return `${sqMeters.toFixed(1)} m2`;
  }
  if (sqMeters < 10000) {
    return `${Math.round(sqMeters)} m2`;
  }
  if (sqMeters < 1000000) {
    const ha = sqMeters / 10000;
    return `${ha.toFixed(1)} ha`;
  }
  const sqKm = sqMeters / 1000000;
  return `${sqKm.toFixed(1)} km2`;
}

/**
 * Generates a user-readable summary for a GeoJSON geometry or feature.
 */
export function getGeometrySummary(obj: any): GeometrySummary | null {
  if (!obj || typeof obj !== 'object') {
    return null;
  }

  const geom = obj.type === 'Feature' ? obj.geometry : obj;
  if (!geom || typeof geom !== 'object' || !geom.type) {
    return null;
  }

  const type = geom.type;
  switch (type) {
    case 'Point': {
      const coords = geom.coordinates;
      if (Array.isArray(coords) && coords.length >= 2) {
        const lng = Number(coords[0]);
        const lat = Number(coords[1]);
        const textSummary = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
        return {
          type: 'Point',
          esriIcon: 'esri-icon-map-pin',
          materialIcon: 'location_on',
          textSummary,
          tooltip: `Point: ${textSummary} (~10m precision)`,
        };
      }
      return {
        type: 'Point',
        esriIcon: 'esri-icon-map-pin',
        materialIcon: 'location_on',
        textSummary: 'Empty Point',
        tooltip: 'Point (no coordinates)',
      };
    }

    case 'MultiPoint': {
      const coords = Array.isArray(geom.coordinates) ? geom.coordinates : [];
      const textSummary = `${coords.length} Point${coords.length === 1 ? '' : 's'}`;
      return {
        type: 'MultiPoint',
        esriIcon: 'esri-icon-map-pin',
        materialIcon: 'location_on',
        textSummary,
        tooltip: `MultiPoint: ${textSummary}`,
      };
    }

    case 'LineString': {
      const coords = Array.isArray(geom.coordinates) ? geom.coordinates : [];
      const nodeCount = coords.length;
      const dist = calculateLineDistance(coords);
      const textSummary = `${nodeCount} Nodes, Dist: ${formatDistance(dist)}`;
      return {
        type: 'Line',
        esriIcon: 'esri-icon-polyline',
        materialIcon: 'timeline',
        textSummary,
        tooltip: `Line: ${textSummary} (Great Circle distance)`,
      };
    }

    case 'MultiLineString': {
      const lines = Array.isArray(geom.coordinates) ? geom.coordinates : [];
      let totalNodes = 0;
      let totalDist = 0;
      for (const line of lines) {
        if (Array.isArray(line)) {
          totalNodes += line.length;
          totalDist += calculateLineDistance(line);
        }
      }
      const textSummary = `${lines.length} Line${lines.length === 1 ? '' : 's'}, ${totalNodes} Nodes, Dist: ${formatDistance(totalDist)}`;
      return {
        type: 'MultiLine',
        esriIcon: 'esri-icon-polyline',
        materialIcon: 'timeline',
        textSummary,
        tooltip: `MultiLine: ${textSummary} (Great Circle distance)`,
      };
    }

    case 'Polygon': {
      const rings = Array.isArray(geom.coordinates) ? geom.coordinates : [];
      let totalNodes = 0;
      for (const ring of rings) {
        if (Array.isArray(ring)) {
          totalNodes += ring.length;
        }
      }
      const area = calculatePolygonArea(rings);
      const textSummary = `${totalNodes} Nodes, Area: ${formatArea(area)}`;
      return {
        type: 'Polygon',
        esriIcon: 'esri-icon-polygon',
        materialIcon: 'pentagon',
        textSummary,
        tooltip: `Polygon: ${textSummary} (Great Circle area)`,
      };
    }

    case 'MultiPolygon': {
      const polys = Array.isArray(geom.coordinates) ? geom.coordinates : [];
      let totalNodes = 0;
      let totalArea = 0;
      for (const poly of polys) {
        if (Array.isArray(poly)) {
          for (const ring of poly) {
            if (Array.isArray(ring)) {
              totalNodes += ring.length;
            }
          }
          totalArea += calculatePolygonArea(poly);
        }
      }
      const textSummary = `${polys.length} Polygon${polys.length === 1 ? '' : 's'}, ${totalNodes} Nodes, Area: ${formatArea(totalArea)}`;
      return {
        type: 'MultiPolygon',
        esriIcon: 'esri-icon-polygon',
        materialIcon: 'pentagon',
        textSummary,
        tooltip: `MultiPolygon: ${textSummary} (Great Circle area)`,
      };
    }

    case 'GeometryCollection': {
      const geoms = Array.isArray(geom.geometries) ? geom.geometries : [];
      const textSummary = `${geoms.length} Geometrie${geoms.length === 1 ? 'y' : 's'}`;
      return {
        type: 'GeometryCollection',
        esriIcon: 'esri-icon-layer',
        materialIcon: 'category',
        textSummary,
        tooltip: `GeometryCollection: ${textSummary}`,
      };
    }

    case 'FeatureCollection': {
      const features = Array.isArray(geom.features) ? geom.features : [];
      const textSummary = `${features.length} Feature${features.length === 1 ? '' : 's'}`;
      return {
        type: 'FeatureCollection',
        esriIcon: 'esri-icon-layer',
        materialIcon: 'category',
        textSummary,
        tooltip: `FeatureCollection: ${textSummary}`,
      };
    }

    default: {
      return {
        type: String(type),
        esriIcon: 'esri-icon-layer',
        materialIcon: 'category',
        textSummary: String(type),
        tooltip: `Geometry: ${String(type)}`,
      };
    }
  }
}

/**
 * Normalizes GeoJSON object:
 * - Removes deprecated/legacy 'crs' attribute (RFC 7946 specifies default WGS 84 and removed 'crs').
 * - Orders 'type' first, followed by standard keys (coordinates, geometries, geometry, features, properties, bbox, etc.).
 */
export function normalizeGeoJson(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(normalizeGeoJson);
  }

  const ordered: any = {};
  // Put 'type' first if present
  if ('type' in obj) {
    ordered.type = obj.type;
  }

  // Desired order for common GeoJSON top-level / geometry keys
  // Note: 'crs' is intentionally removed per RFC 7946
  const preferredOrder = [
    'coordinates',
    'geometries',
    'geometry',
    'features',
    'properties',
    'bbox',
  ];

  for (const key of preferredOrder) {
    if (key in obj && key !== 'type' && key !== 'crs') {
      ordered[key] = normalizeGeoJson(obj[key]);
    }
  }

  // Any remaining keys not in preferredOrder (excluding 'crs')
  for (const key of Object.keys(obj)) {
    if (key !== 'type' && key !== 'crs' && !preferredOrder.includes(key)) {
      ordered[key] = normalizeGeoJson(obj[key]);
    }
  }

  return ordered;
}

export function validateGeoJson(rawText: string | null | undefined): GeoJsonValidationResult {
  if (rawText === null || rawText === undefined || rawText.trim() === '') {
    return { valid: true, parsed: null };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(rawText);
  } catch (e: any) {
    return {
      valid: false,
      error: `Invalid JSON syntax: ${e.message}`,
    };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return {
      valid: false,
      error: 'GeoJSON must be a JSON object',
    };
  }

  if (typeof parsed.type !== 'string' || parsed.type.trim() === '') {
    return {
      valid: false,
      error: 'GeoJSON object missing "type" property',
    };
  }

  if (!VALID_GEOJSON_TYPES.includes(parsed.type)) {
    return {
      valid: false,
      error: `Invalid GeoJSON type "${parsed.type}". Must be one of: ${VALID_GEOMETRY_TYPES.join(', ')}`,
    };
  }

  if (parsed.type === 'GeometryCollection') {
    if (!Array.isArray(parsed.geometries)) {
      return {
        valid: false,
        error: 'GeometryCollection must have a "geometries" array',
      };
    }
  } else if (parsed.type === 'Feature') {
    if (!parsed.geometry || typeof parsed.geometry !== 'object' || !VALID_GEOMETRY_TYPES.includes(parsed.geometry.type)) {
      return {
        valid: false,
        error: 'Feature must contain a valid "geometry" object',
      };
    }
  } else if (parsed.type === 'FeatureCollection') {
    if (!Array.isArray(parsed.features)) {
      return {
        valid: false,
        error: 'FeatureCollection must have a "features" array',
      };
    }
  } else {
    if (!Array.isArray(parsed.coordinates)) {
      return {
        valid: false,
        error: `${parsed.type} must have a "coordinates" array`,
      };
    }

    if (parsed.type === 'Point') {
      if (parsed.coordinates.length < 2 || !parsed.coordinates.slice(0, 2).every((c: any) => typeof c === 'number' && Number.isFinite(c))) {
        return {
          valid: false,
          error: 'Point coordinates must contain at least 2 numbers [longitude, latitude]',
        };
      }
    } else if (parsed.type === 'LineString') {
      if (parsed.coordinates.length < 2) {
        return {
          valid: false,
          error: 'LineString coordinates must have at least 2 positions',
        };
      }
    } else if (parsed.type === 'Polygon') {
      if (parsed.coordinates.length === 0) {
        return {
          valid: false,
          error: 'Polygon coordinates must have at least one linear ring',
        };
      }
      for (let i = 0; i < parsed.coordinates.length; i++) {
        const ring = parsed.coordinates[i];
        if (!Array.isArray(ring) || ring.length < 4) {
          return {
            valid: false,
            error: `Polygon linear ring ${i} must have at least 4 positions (closed ring)`,
          };
        }
      }
    }
  }

  return { valid: true, parsed };
}

@Component({
  selector: 'lib-geometry-control',
  templateUrl: './geometry-control.component.html',
  styleUrls: ['./geometry-control.component.css'],
  standalone: false,
})
export class GeometryControlComponent implements OnInit, ControlValueAccessor {

  private readonly _mode = signal<string | null>(null);

  @Input()
  set mode(value: string | null) {
    this._mode.set(value);
  }
  get mode(): string | null {
    return this._mode();
  }

  private readonly _cell = signal<CellAttribute | null>(null);

  @Input()
  set cell(value: CellAttribute | null) {
    this._cell.set(value);
  }
  get cell(): CellAttribute | null {
    return this._cell();
  }

  get attribute(): MetaAttribute | undefined {
    return this._cell()?.attribute;
  }

  @Input()
  formGroup: UntypedFormGroup;

  @Input()
  name: string;

  @Input()
  disabled = false;

  readonly isExpanded: WritableSignal<boolean> = signal<boolean>(false);
  readonly copied: WritableSignal<boolean> = signal<boolean>(false);
  readonly rawText: WritableSignal<string> = signal<string>('');
  readonly geometryValue: WritableSignal<any> = signal<any>(null);
  readonly validationError: WritableSignal<string | null> = signal<string | null>(null);
  readonly hasEsriFont: WritableSignal<boolean> = signal<boolean>(true);

  readonly isReadOnly = computed(() => {
    return this._mode() === 'view' || (this._cell() && this._cell()?.displayOnly === true);
  });

  readonly attributeName = computed(() => this.name || this._cell()?.attribute?.name || '');

  readonly hasValue = computed(() => {
    const val = this.geometryValue();
    if (val && typeof val === 'object' && Object.keys(val).length > 0) {
      return true;
    }
    const text = this.rawText();
    return text !== null && text !== undefined && text.trim().length > 0;
  });

  readonly geometrySummary = computed(() => {
    const val = this.geometryValue();
    if (val && typeof val === 'object') {
      return getGeometrySummary(val);
    }
    const text = this.rawText();
    if (text && text.trim().length > 0) {
      try {
        const parsed = JSON.parse(text);
        return getGeometrySummary(parsed);
      } catch {
        return null;
      }
    }
    return null;
  });

  readonly singleLineText = computed(() => {
    const val = this.geometryValue();
    if (val && typeof val === 'object' && Object.keys(val).length > 0) {
      return JSON.stringify(normalizeGeoJson(val));
    }
    const text = this.rawText();
    if (text && text.trim().length > 0) {
      try {
        const parsed = JSON.parse(text);
        return JSON.stringify(normalizeGeoJson(parsed));
      } catch (e) {
        return text.replace(/\s+/g, ' ').trim();
      }
    }
    return '';
  });

  readonly multiLineText = computed(() => {
    const val = this.geometryValue();
    if (val && typeof val === 'object' && Object.keys(val).length > 0) {
      return JSON.stringify(normalizeGeoJson(val), null, 2);
    }
    const text = this.rawText();
    if (text && text.trim().length > 0) {
      try {
        const parsed = JSON.parse(text);
        return JSON.stringify(normalizeGeoJson(parsed), null, 2);
      } catch (e) {
        return text;
      }
    }
    return '';
  });

  readonly isValidGeoJson = computed(() => this.validationError() === null && this.hasValue());

  onChange: any = () => {};
  onTouch: any = () => {};

  constructor(
    @Optional() public ngControl: NgControl,
    protected readonly toastService: ToastService,
    protected readonly cdr: ChangeDetectorRef
  ) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngOnInit(): void {
    if (typeof document !== 'undefined' && document.fonts && document.fonts.check) {
      try {
        this.hasEsriFont.set(document.fonts.check('16px CalciteWebCoreIcons'));
        document.fonts.ready.then(() => {
          this.hasEsriFont.set(document.fonts.check('16px CalciteWebCoreIcons'));
        }).catch(() => {});
      } catch (e) {
        // Fallback default is true (assumes main.css loaded)
      }
    }
  }

  toggleExpanded(): void {
    this.isExpanded.update(v => !v);
  }

  onViewControlClick(event: MouseEvent): void {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      return;
    }
    this.toggleExpanded();
  }

  getCSSHeight(cell: CellAttribute | null): string {
    const height: number = cell && cell.height ? Number(cell.height) : 1;
    const cssHeight = 6 + ((height - 1) * 3) + 1;
    return `${cssHeight}em`;
  }

  get formControl(): FormControlWithAttribute | null {
    return this.ngControl?.control instanceof FormControlWithAttribute ? this.ngControl.control : null;
  }

  get touched(): boolean {
    return this.formControl ? this.formControl.touchedSignal() : (this.ngControl?.control?.touched ?? false);
  }

  hasErrors(): boolean {
    if (this.validationError()) {
      return true;
    }
    return this.formControl ? this.formControl.hasErrorsSignal() : (this.ngControl?.errors !== null && this.ngControl?.errors !== undefined);
  }

  get validationResult(): ValidationResult | null {
    if (this.validationError()) {
      return {
        name: this.attributeName(),
        resultType: ResultType.Error,
        message: this.validationError()!,
      };
    }
    const err = this.formControl ? this.formControl.errorsSignal() : (this.ngControl?.errors as any);
    if (err && err.geoJson) {
      return err.geoJson;
    }
    return err as ValidationResult | null;
  }

  writeValue(obj: any): void {
    if (obj) {
      if (typeof obj === 'object') {
        const normalized = normalizeGeoJson(obj);
        this.geometryValue.set(normalized);
        this.rawText.set(JSON.stringify(normalized, null, 2));
        this.validationError.set(null);
      } else if (typeof obj === 'string') {
        const text = obj.trim();
        if (text.length === 0) {
          this.geometryValue.set(null);
          this.rawText.set('');
          this.validationError.set(null);
        } else {
          const result = validateGeoJson(text);
          if (result.valid) {
            const rawGeometry = result.parsed?.type === 'Feature' ? result.parsed.geometry : result.parsed;
            const geometry = normalizeGeoJson(rawGeometry);
            this.geometryValue.set(geometry);
            this.rawText.set(geometry ? JSON.stringify(geometry, null, 2) : text);
            this.validationError.set(null);
          } else {
            this.geometryValue.set(null);
            this.rawText.set(text);
            this.validationError.set(result.error || 'Invalid GeoJSON');
          }
        }
      }
    } else {
      this.geometryValue.set(null);
      this.rawText.set('');
      this.validationError.set(null);
    }
    this.cdr.markForCheck();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onTextInput(event: Event): void {
    const text = (event.target as HTMLTextAreaElement).value;
    this.updateTextValue(text);
  }

  onBlur(): void {
    this.onTouch();
    if (this.formControl) {
      this.formControl.touchedSignal.set(true);
    }
  }

  private updateTextValue(text: string): void {
    this.rawText.set(text);

    if (!text || text.trim().length === 0) {
      this.geometryValue.set(null);
      this.validationError.set(null);
      if (this.ngControl?.control) {
        this.ngControl.control.setErrors(null);
      }
      this.onChange(null);
      return;
    }

    const result = validateGeoJson(text);
    if (result.valid) {
      const rawGeometry = result.parsed?.type === 'Feature' ? result.parsed.geometry : result.parsed;
      const geometry = normalizeGeoJson(rawGeometry);
      this.geometryValue.set(geometry);
      this.validationError.set(null);
      if (this.ngControl?.control) {
        this.ngControl.control.setErrors(null);
      }
      this.onChange(geometry);
    } else {
      this.geometryValue.set(null);
      this.validationError.set(result.error || 'Invalid GeoJSON');
      const errorResult: ValidationResult = {
        name: this.attributeName(),
        resultType: ResultType.Error,
        message: result.error || 'Invalid GeoJSON',
      };
      if (this.ngControl?.control) {
        this.ngControl.control.setErrors(errorResult);
      }
      this.onChange(text);
    }
  }

  formatGeoJson(): void {
    const val = this.geometryValue();
    if (val && typeof val === 'object') {
      const normalized = normalizeGeoJson(val);
      const formatted = JSON.stringify(normalized, null, 2);
      this.rawText.set(formatted);
    } else {
      const text = this.rawText();
      try {
        const parsed = JSON.parse(text);
        const normalized = normalizeGeoJson(parsed);
        const formatted = JSON.stringify(normalized, null, 2);
        this.rawText.set(formatted);
      } catch (e) {
        // do nothing if invalid
      }
    }
  }

  async copyToClipboard(): Promise<void> {
    const textToCopy = this.isReadOnly()
      ? (this.isExpanded() ? this.multiLineText() : (this.singleLineText() || ""))
      : this.rawText();

    if (!textToCopy) {
      return;
    }

    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        this.onCopySuccess();
      } catch (err) {
        console.warn('Clipboard write failed, using fallback', err);
        this.fallbackCopy(textToCopy);
      }
    } else {
      this.fallbackCopy(textToCopy);
    }
  }

  private onCopySuccess(): void {
    this.copied.set(true);
    this.toastService.showSuccess('GeoJSON copied to clipboard');
    setTimeout(() => this.copied.set(false), 2000);
  }

  private fallbackCopy(text: string): void {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.onCopySuccess();
    } catch (e) {
      this.toastService.showError('Failed to copy to clipboard', true);
    }
  }
}
