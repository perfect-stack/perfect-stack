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
      ? (this.isExpanded() ? this.multiLineText() : this.singleLineText() || '')
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
