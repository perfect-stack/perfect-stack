import {
  ChangeDetectorRef,
  Component,
  computed,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Optional,
  signal,
  SimpleChanges,
  WritableSignal,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NgControl,
  UntypedFormGroup,
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { CellAttribute } from '../../../../../meta/page/meta-page-service/meta-page.service';
import { MetaAttribute } from '../../../../../domain/meta.entity';
import { FormControlWithAttribute } from '../../../../data-edit/form-service/form.service';
import { ResultType, ValidationResult } from '../../../../../domain/meta.rule';
import { ToastService } from '../../../../../utils/toasts/toast.service';
import {
  GeoJsonPoint,
  isValidGeoJsonPoint,
  MapService,
  parseGeoJsonGeometry,
} from '../../tool-view/map-tool/map.service';
import {
  MapEditCoordinatorService,
  resolveTargetFromFormGroup,
} from '../../tool-view/map-tool/map-edit-coordinator.service';

export type CenterPointCoordSystem = 'NZTM' | 'WGS84';
export type PairedGeometryKind = 'empty' | 'point' | 'line' | 'polygon' | 'other';

@Component({
  selector: 'lib-center-point-control',
  templateUrl: './center-point-control.component.html',
  styleUrls: ['./center-point-control.component.css'],
  standalone: false,
})
export class CenterPointControlComponent
  implements OnInit, OnChanges, OnDestroy, ControlValueAccessor
{
  private readonly _mode = signal<string | null>(null);
  private readonly _cell = signal<CellAttribute | null>(null);
  private readonly _formGroup = signal<UntypedFormGroup | null>(null);

  @Input()
  set mode(value: string | null) {
    this._mode.set(value);
  }
  get mode(): string | null {
    return this._mode();
  }

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
  set formGroup(value: UntypedFormGroup | undefined | null) {
    this._formGroup.set(value || null);
  }
  get formGroup(): UntypedFormGroup | null {
    return this._formGroup();
  }

  @Input()
  name: string;

  @Input()
  idSuffix?: string | null;

  @Input()
  disabled = false;

  readonly pointValue: WritableSignal<GeoJsonPoint | null> = signal<GeoJsonPoint | null>(null);
  readonly preferredCoordSystem: WritableSignal<CenterPointCoordSystem> =
    signal<CenterPointCoordSystem>('NZTM');
  readonly geometryKind: WritableSignal<PairedGeometryKind> =
    signal<PairedGeometryKind>('empty');
  readonly eastingText: WritableSignal<string> = signal<string>('');
  readonly northingText: WritableSignal<string> = signal<string>('');
  readonly latText: WritableSignal<string> = signal<string>('');
  readonly lngText: WritableSignal<string> = signal<string>('');
  readonly localError: WritableSignal<string | null> = signal<string | null>(null);
  readonly copied: WritableSignal<boolean> = signal<boolean>(false);

  private userExplicitlyChoseWgs84 = false;
  private isSyncingFromCenterpoint = false;
  private readonly destroy$ = new Subject<void>();
  private readonly geomSubReset$ = new Subject<void>();

  readonly isReadOnly = computed(() => {
    return this._mode() === 'view' || this._cell()?.displayOnly === true;
  });

  readonly attributeName = computed(() => this.name || this._cell()?.attribute?.name || 'centerpoint');

  readonly componentId = computed(() => {
    const attr = this.attributeName();
    return this.idSuffix ? `${attr}-${this.idSuffix}` : attr;
  });

  readonly geometryAttributeName = computed(() => {
    const cell = this._cell();
    const compData = cell?.componentData as any;
    return compData?.geometryAttribute || cell?.secondaryAttributeName || 'geometry';
  });

  readonly hasValue = computed(() => this.pointValue() !== null);

  readonly isOutOfNztmBounds = computed(() => {
    const pt = this.pointValue();
    if (!pt) {
      return false;
    }
    const [lng, lat] = pt.coordinates;
    return !this.mapService.isWithinNztmBounds(lat, lng);
  });

  readonly effectiveCoordSystem = computed<CenterPointCoordSystem>(() => {
    if (this.isOutOfNztmBounds()) {
      return 'WGS84';
    }
    return this.preferredCoordSystem();
  });

  readonly isPolygonMissingCenterpoint = computed(() => {
    return this.geometryKind() === 'polygon' && !this.hasValue();
  });

  readonly isLineAutoMidpoint = computed(() => {
    return this.geometryKind() === 'line';
  });

  readonly isPointSynced = computed(() => {
    return this.geometryKind() === 'point';
  });

  readonly hasRegisteredMap = computed(() => {
    return this.mapCoordinator?.hasRegisteredMap() ?? false;
  });

  readonly isAwaitingMapClick = computed(() => {
    return this.mapCoordinator?.isAwaitingCenterpointFor(this._formGroup()) ?? false;
  });

  onChange: any = () => {};
  onTouch: any = () => {};

  constructor(
    @Optional() public ngControl: NgControl,
    protected readonly mapService: MapService,
    protected readonly toastService: ToastService,
    protected readonly cdr: ChangeDetectorRef,
    @Optional() protected readonly mapCoordinator?: MapEditCoordinatorService,
  ) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngOnInit(): void {
    this.bindGeometryListener();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['formGroup'] || changes['cell']) {
      this.bindGeometryListener();
    }
  }

  ngOnDestroy(): void {
    this.geomSubReset$.next();
    this.geomSubReset$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  get formControl(): FormControlWithAttribute | null {
    return this.ngControl?.control instanceof FormControlWithAttribute
      ? this.ngControl.control
      : null;
  }

  get touched(): boolean {
    return this.formControl
      ? this.formControl.touchedSignal()
      : (this.ngControl?.control?.touched ?? false);
  }

  hasErrors(): boolean {
    if (this.localError()) {
      return true;
    }
    return this.formControl
      ? this.formControl.hasErrorsSignal()
      : this.ngControl?.errors !== null && this.ngControl?.errors !== undefined;
  }

  get validationResult(): ValidationResult | null {
    if (this.localError()) {
      return {
        name: this.attributeName(),
        resultType: ResultType.Error,
        message: this.localError()!,
      };
    }
    const err = this.formControl
      ? this.formControl.errorsSignal()
      : (this.ngControl?.errors as any);
    return (err as ValidationResult) || null;
  }

  writeValue(obj: any): void {
    const parsed = parseGeoJsonGeometry(obj);
    if (parsed && isValidGeoJsonPoint(parsed)) {
      const [lng, lat] = parsed.coordinates;
      const point: GeoJsonPoint = {
        type: 'Point',
        coordinates: [Number(lng), Number(lat)],
      };
      this.applyPointToUi(point, true);
    } else {
      this.pointValue.set(null);
      this.eastingText.set('');
      this.northingText.set('');
      this.latText.set('');
      this.lngText.set('');
      this.localError.set(null);
      if (!this.userExplicitlyChoseWgs84) {
        this.preferredCoordSystem.set('NZTM');
      }
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
    this.cdr.markForCheck();
  }

  setCoordSystem(system: CenterPointCoordSystem): void {
    if (system === 'NZTM' && this.isOutOfNztmBounds()) {
      return;
    }
    this.userExplicitlyChoseWgs84 = system === 'WGS84';
    this.preferredCoordSystem.set(system);
    this.localError.set(null);
  }

  onNztmInput(axis: 'easting' | 'northing', event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    if (axis === 'easting') {
      this.eastingText.set(raw);
    } else {
      this.northingText.set(raw);
    }

    const eStr = this.eastingText().trim();
    const nStr = this.northingText().trim();

    if (eStr === '' && nStr === '') {
      this.localError.set(null);
      this.commitPointFromInputs(null);
      return;
    }

    if (eStr === '' || nStr === '' || eStr === '-' || nStr === '-') {
      return;
    }

    const easting = Number(eStr);
    const northing = Number(nStr);
    if (!Number.isFinite(easting) || !Number.isFinite(northing)) {
      this.localError.set('Easting and Northing must be valid numbers.');
      return;
    }

    try {
      const latLng = this.mapService.toLatLng({ easting, northing });
      if (
        !Number.isFinite(latLng.lat) ||
        !Number.isFinite(latLng.lng) ||
        latLng.lat < -90 ||
        latLng.lat > 90 ||
        latLng.lng < -180 ||
        latLng.lng > 180
      ) {
        this.localError.set('Coordinates are outside valid geographic bounds.');
        return;
      }

      const lng = Number(latLng.lng.toFixed(7));
      const lat = Number(latLng.lat.toFixed(7));
      this.latText.set(lat.toFixed(6));
      this.lngText.set(lng.toFixed(6));
      this.localError.set(null);

      this.commitPointFromInputs({ type: 'Point', coordinates: [lng, lat] });
    } catch {
      this.localError.set('Unable to convert NZTM coordinates.');
    }
  }

  onWgs84Input(axis: 'lat' | 'lng', event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    if (axis === 'lat') {
      this.latText.set(raw);
    } else {
      this.lngText.set(raw);
    }

    const latStr = this.latText().trim();
    const lngStr = this.lngText().trim();

    if (latStr === '' && lngStr === '') {
      this.localError.set(null);
      this.eastingText.set('');
      this.northingText.set('');
      this.commitPointFromInputs(null);
      return;
    }

    if (
      latStr === '' ||
      lngStr === '' ||
      latStr === '-' ||
      lngStr === '-' ||
      latStr.endsWith('.') ||
      lngStr.endsWith('.')
    ) {
      return;
    }

    const lat = Number(latStr);
    const lng = Number(lngStr);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      this.localError.set('Latitude and Longitude must be valid numbers.');
      return;
    }
    if (lat < -90 || lat > 90) {
      this.localError.set('Latitude must be between -90 and 90.');
      return;
    }
    if (lng < -180 || lng > 180) {
      this.localError.set('Longitude must be between -180 and 180.');
      return;
    }

    this.localError.set(null);
    if (this.mapService.isWithinNztmBounds(lat, lng)) {
      try {
        const nztm = this.mapService.toNZTM({ lat, lng });
        this.eastingText.set(String(Math.round(nztm.easting)));
        this.northingText.set(String(Math.round(nztm.northing)));
      } catch {
        this.eastingText.set('');
        this.northingText.set('');
      }
    } else {
      this.eastingText.set('');
      this.northingText.set('');
    }

    this.commitPointFromInputs({
      type: 'Point',
      coordinates: [Number(lng.toFixed(7)), Number(lat.toFixed(7))],
    });
  }

  onBlur(): void {
    this.onTouch();
    if (this.formControl) {
      this.formControl.touchedSignal.set(true);
    }
  }

  onSetOnMap(): void {
    if (!this.mapCoordinator || !this.formGroup) {
      return;
    }
    if (this.isAwaitingMapClick()) {
      this.mapCoordinator.exitEdit();
      return;
    }
    const target = resolveTargetFromFormGroup(
      this.formGroup,
      this.geometryAttributeName(),
      this.attributeName(),
    );
    if (target) {
      this.mapCoordinator.startSetCenterpoint(target);
    }
  }

  getFormattedDisplay(): string {
    const pt = this.pointValue();
    if (!pt) {
      return '';
    }
    if (this.effectiveCoordSystem() === 'NZTM') {
      return `E: ${this.eastingText()} m, N: ${this.northingText()} m`;
    }
    return `Lat: ${this.latText()}, Lng: ${this.lngText()}`;
  }

  async copyCoordinates(): Promise<void> {
    const pt = this.pointValue();
    if (!pt) {
      return;
    }
    const text =
      this.effectiveCoordSystem() === 'NZTM'
        ? `${this.eastingText()}, ${this.northingText()}`
        : `${this.latText()}, ${this.lngText()}`;

    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        this.onCopySuccess();
        return;
      } catch {
        // fallback below
      }
    }
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
    } catch {
      this.toastService.showError('Failed to copy coordinates', true);
    }
  }

  private onCopySuccess(): void {
    this.copied.set(true);
    this.toastService.showSuccess('Coordinates copied to clipboard');
    setTimeout(() => this.copied.set(false), 2000);
  }

  private applyPointToUi(point: GeoJsonPoint, updateInputs: boolean): void {
    this.pointValue.set(point);
    const [lng, lat] = point.coordinates;
    const inNztm = this.mapService.isWithinNztmBounds(lat, lng);

    if (updateInputs) {
      this.latText.set(lat.toFixed(6));
      this.lngText.set(lng.toFixed(6));
      if (inNztm) {
        try {
          const nztm = this.mapService.toNZTM({ lat, lng });
          this.eastingText.set(String(Math.round(nztm.easting)));
          this.northingText.set(String(Math.round(nztm.northing)));
        } catch {
          this.eastingText.set('');
          this.northingText.set('');
        }
      } else {
        this.eastingText.set('');
        this.northingText.set('');
      }
    }

    if (!inNztm) {
      this.preferredCoordSystem.set('WGS84');
    } else if (!this.userExplicitlyChoseWgs84) {
      this.preferredCoordSystem.set('NZTM');
    }
    this.localError.set(null);
  }

  private commitPointFromInputs(point: GeoJsonPoint | null): void {
    this.pointValue.set(point);
    if (point && !this.mapService.isWithinNztmBounds(point.coordinates[1], point.coordinates[0])) {
      this.preferredCoordSystem.set('WGS84');
    }

    this.onChange(point);
    this.ngControl?.control?.markAsDirty();
    this.ngControl?.control?.updateValueAndValidity();

    const geomCtrl = this.getPairedGeometryControl();
    if (geomCtrl) {
      const currentGeom = parseGeoJsonGeometry(geomCtrl.value);
      if (!currentGeom || currentGeom.type === 'Point') {
        if (!this.arePointsEqual(currentGeom, point)) {
          this.isSyncingFromCenterpoint = true;
          try {
            geomCtrl.setValue(
              point ? { type: 'Point', coordinates: [...point.coordinates] } : null,
            );
            geomCtrl.markAsDirty();
            geomCtrl.updateValueAndValidity();
          } finally {
            this.isSyncingFromCenterpoint = false;
          }
        }
      }
    }
  }

  private getPairedGeometryControl(): AbstractControl | null {
    return this._formGroup()?.get(this.geometryAttributeName()) ?? null;
  }

  private bindGeometryListener(): void {
    this.geomSubReset$.next();

    const geomCtrl = this.getPairedGeometryControl();
    if (!geomCtrl) {
      this.geometryKind.set('empty');
      return;
    }

    this.updateGeometryKind(geomCtrl.value);

    geomCtrl.valueChanges
      .pipe(takeUntil(this.geomSubReset$), takeUntil(this.destroy$))
      .subscribe((val) => {
        this.updateGeometryKind(val);

        if (this.isSyncingFromCenterpoint || !geomCtrl.dirty) {
          return;
        }

        const parsed = parseGeoJsonGeometry(val);
        if (!parsed) {
          if (this.pointValue() !== null) {
            this.writeValue(null);
            this.onChange(null);
            this.ngControl?.control?.markAsDirty();
            this.ngControl?.control?.updateValueAndValidity();
          }
          return;
        }

        if (parsed.type === 'Point' && isValidGeoJsonPoint(parsed)) {
          const nextPt: GeoJsonPoint = {
            type: 'Point',
            coordinates: [parsed.coordinates[0], parsed.coordinates[1]],
          };
          if (!this.arePointsEqual(this.pointValue(), nextPt)) {
            this.applyPointToUi(nextPt, true);
            this.onChange(nextPt);
            this.ngControl?.control?.markAsDirty();
            this.ngControl?.control?.updateValueAndValidity();
          }
        } else if (parsed.type === 'LineString' || parsed.type === 'MultiLineString') {
          const coords =
            parsed.type === 'LineString' ? parsed.coordinates : parsed.coordinates?.[0];
          const midpoint = this.mapService.calculateLineMidpoint(coords);
          if (midpoint && !this.arePointsEqual(this.pointValue(), midpoint)) {
            this.applyPointToUi(midpoint, true);
            this.onChange(midpoint);
            this.ngControl?.control?.markAsDirty();
            this.ngControl?.control?.updateValueAndValidity();
          }
        } else {
          this.ngControl?.control?.updateValueAndValidity();
          this.cdr.markForCheck();
        }
      });
  }

  private updateGeometryKind(value: any): void {
    const parsed = parseGeoJsonGeometry(value);
    if (!parsed) {
      this.geometryKind.set('empty');
      return;
    }
    switch (parsed.type) {
      case 'Point':
        this.geometryKind.set('point');
        break;
      case 'LineString':
      case 'MultiLineString':
        this.geometryKind.set('line');
        break;
      case 'Polygon':
      case 'MultiPolygon':
        this.geometryKind.set('polygon');
        break;
      default:
        this.geometryKind.set('other');
        break;
    }
  }

  private arePointsEqual(a: any, b: any): boolean {
    if (!a && !b) {
      return true;
    }
    if (!a || !b || a.type !== 'Point' || b.type !== 'Point') {
      return false;
    }
    if (!Array.isArray(a.coordinates) || !Array.isArray(b.coordinates)) {
      return false;
    }
    return (
      Math.abs(Number(a.coordinates[0]) - Number(b.coordinates[0])) < 1e-7 &&
      Math.abs(Number(a.coordinates[1]) - Number(b.coordinates[1])) < 1e-7
    );
  }
}
