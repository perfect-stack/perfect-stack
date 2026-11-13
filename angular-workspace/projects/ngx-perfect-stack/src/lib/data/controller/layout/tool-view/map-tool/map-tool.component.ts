import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  DoCheck,
  effect,
  ElementRef,
  HostListener,
  Inject,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Optional,
  ViewChild,
} from '@angular/core';
import { AbstractControl, FormArray, FormGroup, UntypedFormArray, UntypedFormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { DateTimeFormatter, ZoneId, ZonedDateTime } from '@js-joda/core';
import { Locale } from '@js-joda/locale_en';
import '@js-joda/timezone';
import { distinctUntilChanged, map, Subject, Subscription, takeUntil } from 'rxjs';

import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';
import type { ResourceHandle } from '@arcgis/core/core/Handles';
import Graphic from '@arcgis/core/Graphic';
import Map from '@arcgis/core/Map';
import Point from '@arcgis/core/geometry/Point';
import Polygon from '@arcgis/core/geometry/Polygon';
import Polyline from '@arcgis/core/geometry/Polyline';
import * as labelPointOperator from '@arcgis/core/geometry/operators/labelPointOperator';
import * as webMercatorUtils from '@arcgis/core/geometry/support/webMercatorUtils';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import TileLayer from '@arcgis/core/layers/TileLayer';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import SimpleLineSymbol from '@arcgis/core/symbols/SimpleLineSymbol';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import TextSymbol from '@arcgis/core/symbols/TextSymbol';
import Expand from '@arcgis/core/widgets/Expand';
import MapView from '@arcgis/core/views/MapView';
import Sketch from '@arcgis/core/widgets/Sketch';

import { MapReferenceLayer, MapTool } from '../../../../../domain/meta.page';
import { NgxPerfectStackConfig, STACK_CONFIG } from '../../../../../ngx-perfect-stack-config';
import { PropertySheetService } from '../../../../../template/property-sheet/property-sheet.service';
import { FormContext } from '../../../../data-edit/form-service/form.service';
import { MapAttributionService } from './map-attribution.service';
import {
  MapDrawTool,
  MapEditCoordinatorService,
  MapEditRequest,
  MapEditTarget,
  MapSizeMode,
  resolveTargetFromFormGroup,
} from './map-edit-coordinator.service';
import { GeoJsonPoint, MapService, parseGeoJsonGeometry } from './map.service';

export const LINZ_MAP_SERVICE_URL =
  'https://services1.arcgisonline.co.nz/arcgis/rest/services/LINZ/geotiffs/MapServer';
export const SATELLITE_MAP_SERVICE_URL =
  'https://services1.arcgisonline.co.nz/arcgis/rest/services/Imagery/newzealand/MapServer';
export const WORLD_TOPO_MAP_SERVICE_URL =
  'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer';
export const WORLD_IMAGERY_MAP_SERVICE_URL =
  'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer';

interface OccurrenceAnchor {
  index: number;
  point: Point;
  badgeColor: string;
  labelText: string;
  isHighlighted: boolean;
}

interface PreservedMapCamera {
  lat: number;
  lng: number;
  scale?: number;
}

@Component({
  selector: 'lib-map-tool',
  templateUrl: './map-tool.component.html',
  styleUrls: ['./map-tool.component.css'],
  standalone: false,
})
export class MapToolComponent implements OnInit, AfterViewInit, OnDestroy, DoCheck {
  get mapHeight(): string {
    if (this.mapTool?.height) {
      return this.mapTool.height;
    }
    return this.height || '300px';
  }

  private lastItemsRef: any[] | null = null;
  private lastOccurrenceCount = -1;

  @Input()
  mapTool: MapTool;

  @Input()
  ctx: FormContext;

  @Input()
  formGroup?: FormGroup;

  @Input()
  editorMode = false;

  @Input()
  height = '300px';

  @Input()
  zoom = 10;

  @Input()
  items?: any[];

  @Input()
  basemap: 'topo' | 'satellite' = 'topo';

  activeBasemap: 'topo' | 'satellite' = 'topo';
  coordSystemMode: 'nztm' | 'global' = 'nztm';

  referenceFeatureLayers: { layer: FeatureLayer; config: MapReferenceLayer }[] = [];
  private referenceLayerVisibility: Record<string, boolean> = {};
  expandWidget?: Expand;

  @ViewChild('mapWrapper', { static: false })
  mapWrapper?: ElementRef<HTMLDivElement>;

  @ViewChild('mapContainer', { static: false })
  mapContainer?: ElementRef<HTMLDivElement>;

  isDesktopSplitEligible = typeof window !== 'undefined' ? window.innerWidth >= 1200 : true;
  isCssFullscreen = false;
  private preFullscreenMode: MapSizeMode = 'small';

  mapView?: MapView;
  graphicsLayer?: GraphicsLayer;
  eventGraphicsLayer?: GraphicsLayer;
  occurrenceGraphicsLayer?: GraphicsLayer;
  activeEditLayer?: GraphicsLayer;
  tileLayer?: TileLayer;
  topoLayer?: TileLayer;
  satelliteLayer?: TileLayer;
  map?: Map;
  sketch?: Sketch;

  hasMarker = false;
  hasEventLayerData = false;
  occurrenceCount = 0;

  private hasInitializedView = false;
  private isInternalMapUpdate = false;
  private isSwitchingSketch = false;
  private isRebuildingMap = false;
  private isViewReadyForViewportSync = false;
  private pendingGoToCount = 0;
  private activeEditKind: 'geometry' | 'centerpoint' = 'geometry';

  private occurrenceAnchors: OccurrenceAnchor[] = [];
  private occurrenceBadgeGraphics: Graphic[] = [];
  private viewStationaryHandle?: ResourceHandle;

  geometryControl?: AbstractControl;
  centerpointControl?: AbstractControl;
  eastingControl?: AbstractControl;
  northingControl?: AbstractControl;
  locationControl?: AbstractControl;
  occurrencesArray?: UntypedFormArray;

  private formSub?: Subscription;
  private occSub?: Subscription;
  private attributionHandle?: ResourceHandle;
  private globalClickListener?: (event: MouseEvent) => void;
  private destroy$ = new Subject<void>();

  constructor(
    protected readonly mapService: MapService,
    protected readonly propertySheetService: PropertySheetService,
    protected readonly ngZone: NgZone,
    protected readonly cdr: ChangeDetectorRef,
    protected readonly attributionService: MapAttributionService,
    protected readonly router: Router,
    @Optional() @Inject(STACK_CONFIG) protected readonly stackConfig?: NgxPerfectStackConfig,
    @Optional() public readonly mapCoordinator?: MapEditCoordinatorService,
  ) {
    if (this.mapCoordinator) {
      effect(() => {
        // Track active target, edit phase, hovered target, and size mode signals
        this.mapCoordinator!.activeTarget();
        this.mapCoordinator!.editPhase();
        this.mapCoordinator!.hoveredTarget();
        this.mapCoordinator!.mapSizeMode();

        if (!this.editorMode && this.mapView && this.eventGraphicsLayer) {
          queueMicrotask(() => {
            if (this.mapView && !this.isRebuildingMap) {
              this.renderAllFeatures(false);
              this.cdr.markForCheck();
            }
          });
        }
      });
    }
  }

  get isEditMode(): boolean {
    return this.ctx?.mode === 'edit';
  }

  get isSearchMapMode(): boolean {
    return this.getItems().length > 0;
  }

  get currentSizeMode(): MapSizeMode {
    return this.mapCoordinator?.mapSizeMode() || 'small';
  }

  get isFullscreenActive(): boolean {
    return (
      this.isCssFullscreen ||
      (typeof document !== 'undefined' &&
        !!this.mapWrapper?.nativeElement &&
        document.fullscreenElement === this.mapWrapper.nativeElement)
    );
  }

  get effectiveMapHeight(): string {
    if (this.isFullscreenActive || this.currentSizeMode === 'fullscreen' || this.currentSizeMode === 'split') {
      return '100%';
    }
    if (this.currentSizeMode === 'medium') {
      return 'clamp(380px, 50vh, 600px)';
    }
    if (this.mapTool?.height) {
      return this.mapTool.height;
    }
    if (this.height && this.height !== '300px') {
      return this.height;
    }
    return 'clamp(240px, 32vh, 300px)';
  }

  get currentOccurrenceCycleIndex(): number {
    const active = this.mapCoordinator?.activeTarget();
    if (active?.kind === 'occurrence' && typeof active.index === 'number') {
      return active.index;
    }
    const hovered = this.mapCoordinator?.hoveredTarget();
    if (hovered?.kind === 'occurrence' && typeof hovered.index === 'number') {
      return hovered.index;
    }
    return -1;
  }

  get activeTargetDisplayLabel(): string {
    const active = this.mapCoordinator?.activeTarget();
    if (!active) {
      return '';
    }
    if (active.kind === 'occurrence') {
      const idx = (active.index ?? 0) + 1;
      const val = active.formGroup?.value;
      const taxonName =
        val?.taxon?.canonical_name ||
        val?.taxon?.common_name ||
        val?.taxon?.name ||
        val?.record_number;
      return taxonName ? `Occurrence #${idx} — ${taxonName}` : `Occurrence #${idx}`;
    }
    return active.label || 'Event Location';
  }

  get isActiveTargetPolygon(): boolean {
    const active = this.mapCoordinator?.activeTarget();
    if (!active) {
      return false;
    }
    const geo = parseGeoJsonGeometry(active.formGroup?.get(active.geometryAttr)?.value);
    return geo?.type === 'Polygon' || geo?.type === 'MultiPolygon';
  }

  ngOnInit(): void {
    if (this.mapTool?.basemap === 'satellite' || this.basemap === 'satellite') {
      this.activeBasemap = 'satellite';
    }
    this.initFormListeners();
    this.initCoordinatorListeners();
  }

  ngAfterViewInit(): void {
    if (this.editorMode) {
      return;
    }
    this.mapCoordinator?.registerMap();
    this.coordSystemMode = this.hasCoordinatesOutsideNztm() ? 'global' : 'nztm';
    this.initMap(true);
  }

  ngDoCheck(): void {
    if (this.editorMode) {
      return;
    }

    const currentItems = this.getItems();
    if (currentItems !== this.lastItemsRef) {
      this.lastItemsRef = currentItems;
      if (this.mapView && this.eventGraphicsLayer) {
        this.updateMapLocation(false);
      }
    }

    // Re-bind occurrences FormArray if it appeared or changed row count outside valueChanges
    const resolvedOcc = this.resolveOccurrencesArray();
    if (resolvedOcc !== this.occurrencesArray) {
      this.bindOccurrencesListener(resolvedOcc);
      if (this.mapView && this.eventGraphicsLayer) {
        this.renderAllFeatures(false);
      }
    } else if (resolvedOcc && resolvedOcc.length !== this.lastOccurrenceCount) {
      this.lastOccurrenceCount = resolvedOcc.length;
      if (this.mapView && this.eventGraphicsLayer) {
        this.renderAllFeatures(false);
      }
    }
  }

  ngOnDestroy(): void {
    this.exitFullscreenIfActive();
    if (!this.editorMode) {
      this.mapCoordinator?.unregisterMap();
    }
    this.formSub?.unsubscribe();
    this.occSub?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
    if (this.globalClickListener) {
      window.removeEventListener('click', this.globalClickListener, { capture: true });
      this.globalClickListener = undefined;
    }
    this.cleanupEsriResources();
    this.attributionService.clearAttribution();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (typeof window === 'undefined') {
      return;
    }
    this.isDesktopSplitEligible = window.innerWidth >= 1200;
    if (!this.isDesktopSplitEligible && this.currentSizeMode === 'split') {
      this.mapCoordinator?.setMapSizeMode('medium');
    }
    this.cdr.markForCheck();
  }

  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void {
    if (typeof document === 'undefined' || !this.mapCoordinator) {
      return;
    }
    const wrapperEl = this.mapWrapper?.nativeElement;
    const isNativeFs = !!wrapperEl && document.fullscreenElement === wrapperEl;
    if (!isNativeFs && !this.isCssFullscreen && this.currentSizeMode === 'fullscreen') {
      this.mapCoordinator.setMapSizeMode(this.preFullscreenMode);
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        this.cdr.markForCheck();
      }, 60);
    }
  }

  @HostListener('window:keydown', ['$event'])
  onWindowKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || this.editorMode) {
      return;
    }
    if (this.isCssFullscreen) {
      this.setMapSizeMode(this.preFullscreenMode);
      return;
    }
    if (this.mapCoordinator && this.mapCoordinator.editPhase() !== 'idle') {
      this.doneEditingTarget();
    }
  }

  setMapSizeMode(mode: MapSizeMode): void {
    if (!this.mapCoordinator) {
      return;
    }

    if (mode === 'fullscreen') {
      if (this.currentSizeMode === 'fullscreen' && this.isFullscreenActive) {
        this.setMapSizeMode(this.preFullscreenMode);
        return;
      }
      if (this.currentSizeMode !== 'fullscreen') {
        this.preFullscreenMode = this.currentSizeMode;
      }
      this.mapCoordinator.setMapSizeMode('fullscreen');
      const wrapperEl = this.mapWrapper?.nativeElement;
      if (wrapperEl && typeof wrapperEl.requestFullscreen === 'function') {
        wrapperEl
          .requestFullscreen()
          .then(() => {
            this.isCssFullscreen = false;
            this.cdr.markForCheck();
          })
          .catch(() => {
            this.isCssFullscreen = true;
            this.cdr.markForCheck();
          });
      } else {
        this.isCssFullscreen = true;
      }
    } else {
      const targetMode: MapSizeMode =
        mode === 'split' && !this.isDesktopSplitEligible ? 'medium' : mode;
      this.exitFullscreenIfActive();
      this.mapCoordinator.setMapSizeMode(targetMode);
    }

    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
      if (this.occurrenceAnchors.length > 1) {
        this.updateOccurrenceBadges();
      }
      this.cdr.markForCheck();
    }, 60);
  }

  private exitFullscreenIfActive(): void {
    this.isCssFullscreen = false;
    if (
      typeof document !== 'undefined' &&
      this.mapWrapper?.nativeElement &&
      document.fullscreenElement === this.mapWrapper.nativeElement &&
      typeof document.exitFullscreen === 'function'
    ) {
      document.exitFullscreen().catch(() => {});
    }
  }

  selectFullscreenOccurrence(delta: number): void {
    const occArray = this.resolveOccurrencesArray();
    if (!occArray || occArray.length === 0 || !this.mapCoordinator) {
      return;
    }
    const count = occArray.length;
    const curr = this.currentOccurrenceCycleIndex;
    const nextIdx =
      curr >= 0 ? (curr + delta + count) % count : delta >= 0 ? 0 : count - 1;
    const occForm = occArray.at(nextIdx) as UntypedFormGroup;
    const target = resolveTargetFromFormGroup(occForm, 'geometry', 'centerpoint');
    if (!target) {
      return;
    }
    this.panMapToTarget(target);
    if (this.isEditMode) {
      this.mapCoordinator.editTarget(target);
    } else {
      this.mapCoordinator.setHoveredTarget({ kind: 'occurrence', index: nextIdx });
      this.mapCoordinator.focusCard(nextIdx);
    }
    this.cdr.markForCheck();
  }

  selectFullscreenEvent(): void {
    const locForm = this.getLocationForm() as UntypedFormGroup | null;
    if (!locForm || !this.mapCoordinator) {
      return;
    }
    const target = resolveTargetFromFormGroup(
      locForm,
      this.mapTool?.geometry?.trim() || 'geometry',
      this.mapTool?.centerpoint?.trim() || 'centerpoint',
    );
    if (!target) {
      return;
    }
    this.panMapToTarget(target);
    if (this.isEditMode) {
      this.mapCoordinator.editTarget(target);
    } else {
      this.mapCoordinator.setHoveredTarget({ kind: 'event' });
    }
    this.cdr.markForCheck();
  }

  private cleanupEsriResources(): void {
    if (this.attributionHandle) {
      this.attributionHandle.remove();
      this.attributionHandle = undefined;
    }
    if (this.viewStationaryHandle) {
      this.viewStationaryHandle.remove();
      this.viewStationaryHandle = undefined;
    }
    if (this.sketch) {
      this.sketch.destroy();
      this.sketch = undefined;
    }
    if (this.expandWidget) {
      this.expandWidget.destroy();
      this.expandWidget = undefined;
    }
    if (this.referenceFeatureLayers.length > 0) {
      for (const ref of this.referenceFeatureLayers) {
        ref.layer.destroy();
      }
      this.referenceFeatureLayers = [];
    }
    if (this.topoLayer) {
      this.topoLayer.destroy();
      this.topoLayer = undefined;
    }
    if (this.satelliteLayer) {
      this.satelliteLayer.destroy();
      this.satelliteLayer = undefined;
    }
    if (this.mapView) {
      this.mapView.destroy();
      this.mapView = undefined;
    }
    this.map = undefined;
    this.eventGraphicsLayer = undefined;
    this.occurrenceGraphicsLayer = undefined;
    this.activeEditLayer = undefined;
    this.graphicsLayer = undefined;
    this.occurrenceBadgeGraphics = [];
    this.occurrenceAnchors = [];
    this.isViewReadyForViewportSync = false;
    this.pendingGoToCount = 0;
  }

  setBasemap(type: 'topo' | 'satellite'): void {
    this.activeBasemap = type;
    if (this.topoLayer) {
      this.topoLayer.visible = type === 'topo';
    }
    if (this.satelliteLayer) {
      this.satelliteLayer.visible = type === 'satellite';
    }
    this.cdr.markForCheck();
  }

  getItems(): any[] {
    if (this.items && this.items.length > 0) {
      return this.items;
    }

    const binding = this.mapTool?.binding || 'results';

    if (this.ctx?.dataMap) {
      const dataResult =
        this.ctx.dataMap.get(binding)?.result || this.ctx.dataMap.get('results')?.result;
      if (Array.isArray(dataResult) && dataResult.length > 0) {
        return dataResult;
      }
    }

    if (this.ctx?.formMap) {
      const formGroup = (this.ctx.formMap.get(binding) ||
        this.ctx.formMap.get('results')) as FormGroup;
      if (formGroup) {
        const formArray = formGroup.get(binding) || formGroup.get('results');
        if (formArray && (formArray instanceof FormArray || (formArray as any)?.controls)) {
          return typeof (formArray as any).getRawValue === 'function'
            ? (formArray as any).getRawValue()
            : formArray.value;
        }
        if (typeof (formGroup as any).getRawValue === 'function') {
          const raw = (formGroup as any).getRawValue();
          if (Array.isArray(raw)) return raw;
          if (raw[binding] && Array.isArray(raw[binding])) return raw[binding];
          if (raw.results && Array.isArray(raw.results)) return raw.results;
        }
        if (Array.isArray(formGroup.value)) {
          return formGroup.value;
        }
      }
    }

    return [];
  }

  static resolveProperty(obj: any, path: string | undefined): any {
    if (!obj || !path) {
      return undefined;
    }
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current == null) {
        return undefined;
      }
      current = current[part];
    }
    return current;
  }

  hasGeometryBinding(): boolean {
    return !!(
      this.mapTool?.geometry &&
      typeof this.mapTool.geometry === 'string' &&
      this.mapTool.geometry.trim().length > 0
    );
  }

  hasCenterpointBinding(): boolean {
    return !!(
      this.mapTool?.centerpoint &&
      typeof this.mapTool.centerpoint === 'string' &&
      this.mapTool.centerpoint.trim().length > 0
    );
  }

  hasEastingBinding(): boolean {
    return !!(
      this.mapTool?.easting &&
      typeof this.mapTool.easting === 'string' &&
      this.mapTool.easting.trim().length > 0
    );
  }

  hasNorthingBinding(): boolean {
    return !!(
      this.mapTool?.northing &&
      typeof this.mapTool.northing === 'string' &&
      this.mapTool.northing.trim().length > 0
    );
  }

  getGeometryControl(): AbstractControl | null {
    if (!this.hasGeometryBinding()) {
      return null;
    }
    if (this.geometryControl) {
      return this.geometryControl;
    }
    const geomName = this.mapTool.geometry!.trim();
    const locationForm = this.getLocationForm();
    if (locationForm?.controls[geomName]) {
      this.geometryControl = locationForm.controls[geomName];
      return this.geometryControl;
    }
    if (this.ctx?.formMap) {
      for (const form of this.ctx.formMap.values()) {
        if (form instanceof FormGroup && form.controls[geomName]) {
          this.geometryControl = form.controls[geomName];
          return this.geometryControl;
        }
      }
    }
    return null;
  }

  getCenterpointControl(): AbstractControl | null {
    if (this.centerpointControl) {
      return this.centerpointControl;
    }
    const cpName = this.mapTool?.centerpoint?.trim() || 'centerpoint';
    const locationForm = this.getLocationForm();
    if (locationForm?.controls[cpName]) {
      this.centerpointControl = locationForm.controls[cpName];
      return this.centerpointControl;
    }
    return null;
  }

  getEastingControl(): AbstractControl | null {
    if (!this.hasEastingBinding()) {
      return null;
    }
    if (this.eastingControl) {
      return this.eastingControl;
    }
    const name = this.mapTool.easting!.trim();
    const locationForm = this.getLocationForm();
    if (locationForm?.controls[name]) {
      this.eastingControl = locationForm.controls[name];
      return this.eastingControl;
    }
    if (this.ctx?.formMap) {
      for (const form of this.ctx.formMap.values()) {
        if (form instanceof FormGroup && form.controls[name]) {
          this.eastingControl = form.controls[name];
          return this.eastingControl;
        }
      }
    }
    return null;
  }

  getNorthingControl(): AbstractControl | null {
    if (!this.hasNorthingBinding()) {
      return null;
    }
    if (this.northingControl) {
      return this.northingControl;
    }
    const name = this.mapTool.northing!.trim();
    const locationForm = this.getLocationForm();
    if (locationForm?.controls[name]) {
      this.northingControl = locationForm.controls[name];
      return this.northingControl;
    }
    if (this.ctx?.formMap) {
      for (const form of this.ctx.formMap.values()) {
        if (form instanceof FormGroup && form.controls[name]) {
          this.northingControl = form.controls[name];
          return this.northingControl;
        }
      }
    }
    return null;
  }

  getLocationForm(): FormGroup | null {
    if (this.formGroup) {
      return this.formGroup;
    }

    if (!this.ctx?.formMap) {
      return null;
    }

    let locationForm =
      (this.ctx.formMap.get('capture_event.location') as FormGroup) ||
      (this.ctx.formMap.get('location') as FormGroup) ||
      (this.ctx.formMap.get('event') as FormGroup) ||
      (this.ctx.formMap.get('place') as FormGroup);

    if (!locationForm) {
      const ce = this.ctx.formMap.get('capture_event');
      if (ce instanceof FormGroup && ce.controls['location'] instanceof FormGroup) {
        locationForm = ce.controls['location'] as FormGroup;
      }
    }

    const geomName = this.hasGeometryBinding() ? this.mapTool.geometry!.trim() : null;
    const eastingName = this.hasEastingBinding() ? this.mapTool.easting!.trim() : null;
    const northingName = this.hasNorthingBinding() ? this.mapTool.northing!.trim() : null;

    if (!locationForm) {
      for (const form of this.ctx.formMap.values()) {
        if (form instanceof FormGroup) {
          if (
            (geomName && form.controls[geomName]) ||
            (eastingName && form.controls[eastingName]) ||
            (northingName && form.controls[northingName])
          ) {
            locationForm = form;
            break;
          }
        }
      }
    }

    if (!locationForm && this.ctx.formMap.size > 0) {
      const first = this.ctx.formMap.values().next().value;
      if (first instanceof FormGroup) {
        locationForm = first;
      }
    }

    return locationForm || null;
  }

  resolveOccurrencesArray(): UntypedFormArray | null {
    const binding = this.mapTool?.occurrencesBinding?.trim();
    if (binding === 'none') {
      return null;
    }

    if (binding && this.ctx?.formMap) {
      const direct = this.ctx.formMap.get(binding);
      if (direct instanceof UntypedFormArray) {
        return direct;
      }
      const parts = binding.split('.');
      if (parts.length >= 2) {
        let curr: AbstractControl | undefined | null = this.ctx.formMap.get(parts[0]);
        for (let i = 1; i < parts.length && curr; i++) {
          curr = curr.get(parts[i]);
        }
        if (curr instanceof UntypedFormArray || (curr as any)?.controls) {
          return curr as UntypedFormArray;
        }
      }
    }

    const ce = this.ctx?.formMap?.get('capture_event');
    if (ce) {
      const occ = ce.get('occurrences');
      if (occ instanceof UntypedFormArray || (occ as any)?.controls) {
        return occ as UntypedFormArray;
      }
    }

    const parent = this.getLocationForm()?.parent;
    if (parent instanceof FormGroup) {
      const occ = parent.get('occurrences');
      if (occ instanceof UntypedFormArray || (occ as any)?.controls) {
        return occ as UntypedFormArray;
      }
    }

    return null;
  }

  // --- Coordinate / Spatial Reference Helpers ---

  get mapWkid(): number {
    return this.coordSystemMode === 'global' ? 3857 : 2193;
  }

  get mapSpatialReference(): { wkid: number } {
    return { wkid: this.mapWkid };
  }

  wgs84ToMapXY(lng: number, lat: number): [number, number] {
    if (this.coordSystemMode === 'global') {
      const clampedLat = Math.max(-85.05112878, Math.min(85.05112878, lat));
      const [x, y] = webMercatorUtils.lngLatToXY(lng, clampedLat);
      return [x, y];
    }
    const nztm = this.mapService.toNZTM({ lat, lng });
    return [nztm.easting, nztm.northing];
  }

  mapXYToWgs84(x: number, y: number): { lat: number; lng: number } {
    if (this.coordSystemMode === 'global') {
      const [lng, lat] = webMercatorUtils.xyToLngLat(x, y);
      return { lat, lng };
    }
    return this.mapService.toLatLng({ easting: x, northing: y });
  }

  private isGeoWithinNztmBounds(geo: any): boolean {
    const parsed = parseGeoJsonGeometry(geo);
    if (!parsed || !parsed.coordinates) {
      return true;
    }

    const checkCoord = (pt: any): boolean => {
      if (Array.isArray(pt) && pt.length >= 2 && typeof pt[0] === 'number' && typeof pt[1] === 'number') {
        return this.mapService.isWithinNztmBounds(pt[1], pt[0]);
      }
      return true;
    };

    switch (parsed.type) {
      case 'Point':
        return checkCoord(parsed.coordinates);
      case 'MultiPoint':
      case 'LineString':
        return Array.isArray(parsed.coordinates)
          ? parsed.coordinates.every(checkCoord)
          : true;
      case 'MultiLineString':
      case 'Polygon':
        return Array.isArray(parsed.coordinates)
          ? parsed.coordinates.every((ring: any) => Array.isArray(ring) && ring.every(checkCoord))
          : true;
      case 'MultiPolygon':
        return Array.isArray(parsed.coordinates)
          ? parsed.coordinates.every(
              (poly: any) =>
                Array.isArray(poly) &&
                poly.every((ring: any) => Array.isArray(ring) && ring.every(checkCoord)),
            )
          : true;
      default:
        return true;
    }
  }

  hasCoordinatesOutsideNztm(): boolean {
    const items = this.getItems();
    if (items && items.length > 0) {
      const geomAttr = this.mapTool?.geometry || 'geometry';
      const cpAttr = this.mapTool?.centerpoint || 'centerpoint';
      for (const item of items) {
        const geo =
          MapToolComponent.resolveProperty(item, geomAttr) ??
          item.location?.geometry ??
          item.geometry ??
          item.location_geometry;
        if (geo && !this.isGeoWithinNztmBounds(geo)) {
          return true;
        }
        const cp =
          MapToolComponent.resolveProperty(item, cpAttr) ??
          item.location?.centerpoint ??
          item.location_centerpoint ??
          item.centerpoint;
        if (cp && !this.isGeoWithinNztmBounds(cp)) {
          return true;
        }
      }
      return false;
    }

    const locForm = this.getLocationForm();
    if (locForm) {
      const geomName = this.mapTool?.geometry?.trim() || 'geometry';
      const cpName = this.mapTool?.centerpoint?.trim() || 'centerpoint';
      const locGeo = locForm.get(geomName)?.value;
      const locCp = locForm.get(cpName)?.value;
      if ((locGeo && !this.isGeoWithinNztmBounds(locGeo)) || (locCp && !this.isGeoWithinNztmBounds(locCp))) {
        return true;
      }
    }

    const occArray = this.resolveOccurrencesArray();
    if (occArray) {
      for (const ctrl of occArray.controls) {
        const geo = ctrl.get('geometry')?.value;
        const cp = ctrl.get('centerpoint')?.value;
        if ((geo && !this.isGeoWithinNztmBounds(geo)) || (cp && !this.isGeoWithinNztmBounds(cp))) {
          return true;
        }
      }
    }

    return false;
  }

  private syncCoordSystemWithData(zoomIfChanged = true): boolean {
    const hasOutsideData = this.hasCoordinatesOutsideNztm();
    if (hasOutsideData) {
      if (this.coordSystemMode !== 'global' && this.mapView && !this.isRebuildingMap) {
        this.rebuildMapForCoordSystem('global', zoomIfChanged);
        return true;
      }
      return false;
    }

    if (this.coordSystemMode === 'global' && this.mapView && !this.isRebuildingMap) {
      if (zoomIfChanged || this.isCurrentExtentWithinBounds('enter-nztm')) {
        this.rebuildMapForCoordSystem('nztm', zoomIfChanged);
        return true;
      }
    }
    return false;
  }

  private isCurrentExtentWithinBounds(mode: 'leave-nztm' | 'enter-nztm'): boolean {
    const view = this.mapView;
    const extent = view?.extent;
    if (!view || !extent) {
      return true;
    }

    const { xmin, ymin, xmax, ymax } = extent;
    if (![xmin, ymin, xmax, ymax].every((v) => typeof v === 'number' && Number.isFinite(v))) {
      return false;
    }

    const width = Math.abs(xmax - xmin);
    const height = Math.abs(ymax - ymin);
    if (width === 0 || height === 0) {
      return true;
    }

    if (this.coordSystemMode === 'nztm') {
      if (width > 2_600_000 || height > 3_800_000) {
        return false;
      }
    } else {
      if (mode === 'enter-nztm') {
        if (
          width > 1_900_000 ||
          height > 2_800_000 ||
          (typeof view.scale === 'number' && Number.isFinite(view.scale) && view.scale > 5_500_000)
        ) {
          return false;
        }
      } else if (width > 3_400_000 || height > 5_300_000) {
        return false;
      }
    }

    const midX = (xmin + xmax) / 2;
    const midY = (ymin + ymax) / 2;
    const samplePoints: [number, number][] = [
      [xmin, ymin],
      [midX, ymin],
      [xmax, ymin],
      [xmin, midY],
      [midX, midY],
      [xmax, midY],
      [xmin, ymax],
      [midX, ymax],
      [xmax, ymax],
    ];

    for (const [x, y] of samplePoints) {
      if (this.coordSystemMode === 'nztm') {
        if (x < -1_500_000 || x > 4_800_000 || y < 2_500_000 || y > 8_000_000) {
          return false;
        }
      }
      try {
        const wgs = this.mapXYToWgs84(x, y);
        if (!wgs || !Number.isFinite(wgs.lat) || !Number.isFinite(wgs.lng)) {
          return false;
        }
        const inBounds =
          mode === 'enter-nztm'
            ? this.mapService.isWithinNztmReturnBounds(wgs.lat, wgs.lng)
            : this.mapService.isWithinNztmBounds(wgs.lat, wgs.lng);
        if (!inBounds) {
          return false;
        }
      } catch {
        return false;
      }
    }

    return true;
  }

  private captureCurrentCamera(): PreservedMapCamera | null {
    const view = this.mapView;
    if (!view || !view.center) {
      return null;
    }

    let lat = -41.20588830649284;
    let lng = 174.91502957335638;
    try {
      const wgs = this.mapXYToWgs84(view.center.x, view.center.y);
      if (wgs && Number.isFinite(wgs.lat) && Number.isFinite(wgs.lng)) {
        lat = Math.max(-85, Math.min(85, wgs.lat));
        lng = ((((wgs.lng + 180) % 360) + 360) % 360) - 180;
      }
    } catch {
      // Keep fallback center
    }

    const scale =
      typeof view.scale === 'number' && Number.isFinite(view.scale) && view.scale > 0
        ? view.scale
        : undefined;

    return { lat, lng, scale };
  }

  private convertScaleForCoordMode(
    scale: number | undefined,
    lat: number,
    fromMode: 'nztm' | 'global',
    toMode: 'nztm' | 'global',
  ): number | undefined {
    if (!scale || !Number.isFinite(scale) || scale <= 0 || fromMode === toMode) {
      return scale;
    }
    const cosLat = Math.max(
      0.25,
      Math.cos((Math.max(-75, Math.min(75, lat)) * Math.PI) / 180),
    );
    return toMode === 'global' ? scale / cosLat : scale * cosLat;
  }

  private syncCoordSystemWithViewport(): void {
    if (
      this.editorMode ||
      this.isRebuildingMap ||
      !this.isViewReadyForViewportSync ||
      !this.mapView?.ready ||
      !this.mapView?.extent ||
      this.mapView.navigating ||
      this.pendingGoToCount > 0
    ) {
      return;
    }

    if (this.coordSystemMode === 'nztm') {
      if (!this.isCurrentExtentWithinBounds('leave-nztm')) {
        this.rebuildMapForCoordSystem('global', false, true);
      }
    } else if (
      !this.hasCoordinatesOutsideNztm() &&
      this.isCurrentExtentWithinBounds('enter-nztm')
    ) {
      this.rebuildMapForCoordSystem('nztm', false, true);
    }
  }

  private executeGoTo(target: any, options?: any): void {
    if (!this.mapView) {
      return;
    }
    this.pendingGoToCount++;
    this.mapView
      .goTo(target, options)
      .catch(() => {})
      .finally(() => {
        this.pendingGoToCount = Math.max(0, this.pendingGoToCount - 1);
        if (this.pendingGoToCount === 0 && this.mapView?.stationary && !this.mapView?.navigating) {
          this.ngZone.run(() => {
            this.syncCoordSystemWithViewport();
          });
        }
      });
  }

  private rebuildMapForCoordSystem(
    newMode: 'nztm' | 'global',
    zoomToFeatures = true,
    preserveCamera = false,
  ): void {
    if (!this.mapContainer?.nativeElement || this.isRebuildingMap) {
      return;
    }
    this.isRebuildingMap = true;
    const savedActiveTarget = this.mapCoordinator?.activeTarget() ?? null;
    const savedPhase = this.mapCoordinator?.editPhase() ?? 'idle';
    const savedDrawTool = this.mapCoordinator?.activeDrawTool() ?? null;
    const savedEditKind = this.activeEditKind;
    const savedExpandExpanded = !!this.expandWidget?.expanded;
    for (const ref of this.referenceFeatureLayers) {
      this.referenceLayerVisibility[ref.config.id] = ref.layer.visible;
    }

    let preservedCamera: PreservedMapCamera | null = null;
    if (preserveCamera) {
      const rawCamera = this.captureCurrentCamera();
      if (rawCamera) {
        preservedCamera = {
          lat: rawCamera.lat,
          lng: rawCamera.lng,
          scale: this.convertScaleForCoordMode(
            rawCamera.scale,
            rawCamera.lat,
            this.coordSystemMode,
            newMode,
          ),
        };
      }
    }

    try {
      this.cleanupEsriResources();
      this.coordSystemMode = newMode;
      this.hasInitializedView = !zoomToFeatures;
      this.initMap(zoomToFeatures, preservedCamera, () => {
        if (savedExpandExpanded && this.expandWidget) {
          this.expandWidget.expanded = true;
        }
        // Re-open active sketch if the user was actively editing a target
        if (savedActiveTarget && savedPhase !== 'idle' && this.isEditMode) {
          this.activeEditKind = savedEditKind;
          if (savedPhase === 'awaiting-centerpoint') {
            this.mapCoordinator?.setPhase('awaiting-centerpoint');
          } else if (savedPhase === 'drawing' && savedDrawTool) {
            this.sketch?.create(savedDrawTool).catch(() => {});
          } else if (savedEditKind === 'centerpoint') {
            const cpVal = parseGeoJsonGeometry(
              savedActiveTarget.formGroup?.get(savedActiveTarget.centerpointAttr)?.value,
            );
            if (cpVal && cpVal.type === 'Point') {
              const pt = this.geoJsonToEsriGeometry(cpVal) as Point | null;
              if (pt) {
                this.commitCenterpointAndEnterPinAdjust(savedActiveTarget, cpVal, pt);
              }
            }
          } else {
            const preferredTool = savedPhase === 'quick-move' ? 'move' : undefined;
            this.loadActiveTargetIntoSketch(savedActiveTarget, preferredTool);
          }
        }
      });
    } finally {
      this.isRebuildingMap = false;
      this.cdr.markForCheck();
    }
  }

  // --- Map Initialization ---

  private initMap(
    initialLoad = true,
    preservedCamera: PreservedMapCamera | null = null,
    onReady?: () => void,
  ): void {
    if (!this.mapContainer?.nativeElement) {
      return;
    }

    this.isViewReadyForViewportSync = false;

    const topoUrl =
      this.coordSystemMode === 'global' ? WORLD_TOPO_MAP_SERVICE_URL : LINZ_MAP_SERVICE_URL;
    const satUrl =
      this.coordSystemMode === 'global' ? WORLD_IMAGERY_MAP_SERVICE_URL : SATELLITE_MAP_SERVICE_URL;

    this.topoLayer = new TileLayer({
      url: topoUrl,
      title: this.coordSystemMode === 'global' ? 'World Topo' : 'LINZ Topo',
      visible: this.activeBasemap === 'topo',
    });
    this.tileLayer = this.topoLayer;

    this.satelliteLayer = new TileLayer({
      url: satUrl,
      title: this.coordSystemMode === 'global' ? 'World Imagery' : 'Satellite',
      visible: this.activeBasemap === 'satellite',
    });

    this.eventGraphicsLayer = new GraphicsLayer({ id: 'event-graphics-layer' });
    this.occurrenceGraphicsLayer = new GraphicsLayer({ id: 'occurrence-graphics-layer' });
    this.activeEditLayer = new GraphicsLayer({ id: 'active-edit-layer' });
    this.graphicsLayer = this.eventGraphicsLayer;

    this.map = new Map({
      layers: [
        this.topoLayer,
        this.satelliteLayer,
        this.eventGraphicsLayer,
        this.occurrenceGraphicsLayer,
        this.activeEditLayer,
      ],
    });

    const centerLat = preservedCamera
      ? preservedCamera.lat
      : this.coordSystemMode === 'global'
        ? 20
        : -41.20588830649284;
    const centerLng = preservedCamera
      ? preservedCamera.lng
      : this.coordSystemMode === 'global'
        ? 0
        : 174.91502957335638;
    const [initX, initY] = this.wgs84ToMapXY(centerLng, centerLat);

    const viewProperties: any = {
      container: this.mapContainer.nativeElement,
      map: this.map,
      center: new Point({
        x: initX,
        y: initY,
        spatialReference: this.mapSpatialReference,
      }),
      attributionVisible: false,
    };

    if (
      preservedCamera &&
      typeof preservedCamera.scale === 'number' &&
      Number.isFinite(preservedCamera.scale) &&
      preservedCamera.scale > 0
    ) {
      viewProperties.scale = preservedCamera.scale;
    } else {
      viewProperties.zoom = this.coordSystemMode === 'global' ? 2 : this.zoom;
    }

    this.mapView = new MapView(viewProperties);

    this.mapView.attributionVisible = false;
    this.mapView.ui.components = ['zoom'];

    this.initReferenceLayers();

    this.attributionHandle = reactiveUtils.watch(
      () => this.mapView?.attributionItems,
      (items) => {
        this.ngZone.run(() => {
          if (!items || items.length === 0) {
            this.attributionService.setAttribution(null);
            return;
          }
          const credits = items.map((item: any) => item.text).join(' | ');
          this.attributionService.setAttribution(`Powered by Esri | ${credits}`);
        });
      },
      { initial: true },
    );

    this.viewStationaryHandle = reactiveUtils.watch(
      () => this.mapView?.stationary,
      (stationary) => {
        if (!stationary) {
          return;
        }
        this.ngZone.run(() => {
          if (this.occurrenceAnchors.length > 1) {
            this.updateOccurrenceBadges();
          }
          this.syncCoordSystemWithViewport();
        });
      },
    );

    this.mapView.on('click', (event: any) => {
      this.ngZone.run(() => {
        this.onMapClick(event);
      });
    });

    this.mapView.when(() => {
      this.ngZone.run(() => {
        this.updateMapLocation(initialLoad, !preservedCamera);
        if (this.ctx && this.ctx.mode === 'edit') {
          this.initSketch();
        }
        if (onReady) {
          onReady();
        }
        this.isViewReadyForViewportSync = true;
      });
    });

    if (this.mapView?.popup && typeof (this.mapView.popup as any).on === 'function') {
      (this.mapView.popup as any).on('trigger-action', (event: any) => {
        if (event.action && event.action.id === 'view-details') {
          const item = this.mapView?.popup?.selectedFeature?.attributes;
          if (item) {
            const url = this.resolveDetailsUrl(item);
            if (url) {
              this.ngZone.run(() => {
                this.router.navigateByUrl(url);
              });
            }
          }
        }
      });
    }

    if (!this.globalClickListener) {
      this.globalClickListener = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        const el = target?.closest?.('[data-url], [data-entity-id]') as HTMLElement | null;
        if (el) {
          const directUrl = el.getAttribute('data-url');
          if (directUrl) {
            event.preventDefault();
            event.stopPropagation();
            this.ngZone.run(() => {
              this.router.navigateByUrl(directUrl);
            });
            return;
          }
          const metaEntity = el.getAttribute('data-meta-entity') || this.getMetaEntityName();
          const entityId = el.getAttribute('data-entity-id');
          if (metaEntity && entityId) {
            event.preventDefault();
            event.stopPropagation();
            this.ngZone.run(() => {
              this.router.navigateByUrl(`/data/${metaEntity}/view/${entityId}`);
            });
          }
        }
      };
      window.addEventListener('click', this.globalClickListener, { capture: true });
    }
  }

  private initSketch(): void {
    if (!this.mapView || !this.activeEditLayer) {
      return;
    }

    this.sketch = new Sketch({
      view: this.mapView,
      layer: this.activeEditLayer,
      creationMode: 'update',
      visibleElements: {
        createTools: {
          point: true,
          polyline: true,
          polygon: true,
          circle: false,
          rectangle: false,
          multipoint: false,
        },
        selectionTools: {
          'lasso-selection': false,
          'rectangle-selection': false,
        },
        settingsMenu: false,
      },
    });

    const pointSymbol = new SimpleMarkerSymbol({
      style: 'circle',
      color: '#ff2dc0',
      size: 13,
      outline: { color: '#ffffff', width: 2 },
    });

    const polylineSymbol = new SimpleLineSymbol({
      color: '#ff2dc0',
      width: 3,
    });

    const polygonSymbol = new SimpleFillSymbol({
      color: [255, 45, 192, 0.28],
      outline: { color: '#ff2dc0', width: 3 },
    });

    this.sketch.viewModel.pointSymbol = pointSymbol;
    this.sketch.viewModel.polylineSymbol = polylineSymbol;
    this.sketch.viewModel.polygonSymbol = polygonSymbol;
    this.sketch.viewModel.activeFillSymbol = polygonSymbol;

    this.mapView.ui.add(this.sketch, 'top-right');

    this.sketch.on('create', (event: any) => {
      this.ngZone.run(() => {
        if (this.isSwitchingSketch) {
          return;
        }

        if (event.state === 'start') {
          this.ensureActiveTarget();
          this.activeEditKind = 'geometry';
          const toolName = event.tool as MapDrawTool;
          if (toolName === 'point' || toolName === 'polyline' || toolName === 'polygon') {
            this.mapCoordinator?.startDraw(toolName);
          }
        }

        if (event.state === 'complete' && event.graphic) {
          const target = this.ensureActiveTarget();
          const others =
            this.activeEditLayer?.graphics.filter((g) => g !== event.graphic).toArray() || [];
          if (others.length > 0) {
            this.activeEditLayer?.removeMany(others);
          }

          const createdType = event.graphic.geometry?.type;
          this.saveGraphicToTarget(event.graphic, target, true);

          if (createdType === 'polygon') {
            // Keep the Polygon visible underneath while waiting for Step 2 click
            this.isSwitchingSketch = true;
            try {
              this.activeEditLayer?.removeAll();
            } finally {
              this.isSwitchingSketch = false;
            }
            this.mapCoordinator?.setPhase('awaiting-centerpoint');
            this.renderAllFeatures(false);
          } else {
            this.mapCoordinator?.setPhase('updating');
            this.renderAllFeatures(false);
          }
          this.cdr.markForCheck();
        }

        if (event.state === 'cancel') {
          if (this.mapCoordinator?.editPhase() === 'drawing') {
            this.mapCoordinator?.setPhase('updating');
          }
          this.cdr.markForCheck();
        }
      });
    });

    this.sketch.on('update', (event: any) => {
      this.ngZone.run(() => {
        if (this.isSwitchingSketch || event.state === 'start') {
          return;
        }
        if (event.graphics?.length > 0) {
          const target = this.ensureActiveTarget();
          if (this.activeEditKind === 'centerpoint') {
            this.saveCenterpointGraphicToTarget(event.graphics[0], target);
          } else {
            this.saveGraphicToTarget(event.graphics[0], target, false);
          }
        }
      });
    });

    this.sketch.on('delete', () => {
      this.ngZone.run(() => {
        if (this.isSwitchingSketch) {
          return;
        }
        const target = this.mapCoordinator?.activeTarget();
        if (target) {
          this.clearTargetCoordinates(target);
        } else {
          this.clearCoordinates();
        }
      });
    });
  }

  private ensureActiveTarget(): MapEditTarget | null {
    const current = this.mapCoordinator?.activeTarget();
    if (current) {
      return current;
    }
    const locForm = this.getLocationForm() as UntypedFormGroup | null;
    if (!locForm) {
      return null;
    }
    const target = resolveTargetFromFormGroup(
      locForm,
      this.mapTool?.geometry?.trim() || 'geometry',
      this.mapTool?.centerpoint?.trim() || 'centerpoint',
    );
    if (target && this.mapCoordinator) {
      this.mapCoordinator.activeTarget.set(target);
    }
    return target;
  }

  private cancelSketchSafely(): void {
    this.isSwitchingSketch = true;
    try {
      if (this.sketch) {
        this.sketch.cancel();
      }
      this.activeEditLayer?.removeAll();
    } catch {
      // ignore sketch cancel errors when idle
    } finally {
      this.isSwitchingSketch = false;
    }
  }

  private initCoordinatorListeners(): void {
    if (!this.mapCoordinator) {
      return;
    }

    this.mapCoordinator.editRequest$
      .pipe(takeUntil(this.destroy$))
      .subscribe((req: MapEditRequest) => {
        this.handleCoordinatorEditRequest(req);
      });

    this.mapCoordinator.panToTarget$
      .pipe(takeUntil(this.destroy$))
      .subscribe((target: MapEditTarget) => {
        this.panMapToTarget(target);
      });

    this.mapCoordinator.cancelEdit$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.activeEditKind = 'geometry';
        this.cancelSketchSafely();
        this.renderAllFeatures(false);
        this.cdr.markForCheck();
      });
  }

  private handleCoordinatorEditRequest(req: MapEditRequest): void {
    if (this.editorMode || !this.mapView) {
      return;
    }

    this.cancelSketchSafely();
    this.syncCoordSystemWithData(false);

    if (req.mode === 'centerpoint') {
      this.activeEditKind = 'centerpoint';
      this.panMapToTarget(req.target);
      this.renderAllFeatures(false);
      this.cdr.markForCheck();
      return;
    }

    this.activeEditKind = 'geometry';
    this.panMapToTarget(req.target);

    const geomVal = parseGeoJsonGeometry(req.target.formGroup?.get(req.target.geometryAttr)?.value);
    if (geomVal && geomVal.coordinates && !req.drawTool) {
      this.loadActiveTargetIntoSketch(req.target);
    } else {
      const tool: MapDrawTool = req.drawTool || 'point';
      this.mapCoordinator?.startDraw(tool);
      this.renderAllFeatures(false);
      this.sketch?.create(tool).catch(() => {});
    }
    this.cdr.markForCheck();
  }

  private loadActiveTargetIntoSketch(
    target: MapEditTarget,
    preferredUpdateTool?: 'reshape' | 'move',
  ): void {
    if (!this.sketch || !this.activeEditLayer) {
      return;
    }
    const geomVal = parseGeoJsonGeometry(target.formGroup?.get(target.geometryAttr)?.value);
    if (!geomVal) {
      return;
    }

    const esriGeom = this.geoJsonToEsriGeometry(geomVal);
    if (!esriGeom) {
      return;
    }

    const symbol = this.getActiveEditSymbolForType(esriGeom.type);
    const editGraphic = new Graphic({ geometry: esriGeom, symbol });

    this.isSwitchingSketch = true;
    try {
      this.activeEditLayer.removeAll();
      this.activeEditLayer.add(editGraphic);
    } finally {
      this.isSwitchingSketch = false;
    }

    this.renderAllFeatures(false);

    const updateTool =
      preferredUpdateTool || (esriGeom.type === 'point' ? 'move' : 'reshape');

    this.sketch
      .update([editGraphic], { tool: updateTool, toggleToolOnClick: false })
      .catch(() => {});
  }

  private getActiveEditSymbolForType(esriGeomType: string): any {
    if (esriGeomType === 'point') {
      return new SimpleMarkerSymbol({
        style: 'circle',
        color: '#ff2dc0',
        size: 13,
        outline: { color: '#ffffff', width: 2 },
      });
    }
    if (esriGeomType === 'polyline') {
      return new SimpleLineSymbol({
        color: '#ff2dc0',
        width: 3.5,
      });
    }
    return new SimpleFillSymbol({
      color: [255, 45, 192, 0.28],
      outline: { color: '#ff2dc0', width: 3 },
    });
  }

  // --- Target Banner Actions ---

  startBannerDraw(tool: MapDrawTool): void {
    if (!this.sketch || !this.mapCoordinator) {
      return;
    }
    this.activeEditKind = 'geometry';
    this.cancelSketchSafely();
    this.mapCoordinator.startDraw(tool);
    this.renderAllFeatures(false);
    this.sketch.create(tool).catch(() => {});
    this.cdr.markForCheck();
  }

  toggleMoveMode(): void {
    const active = this.mapCoordinator?.activeTarget();
    if (!active || !this.sketch) {
      return;
    }
    const isCurrentlyMove = this.mapCoordinator?.editPhase() === 'quick-move';
    this.cancelSketchSafely();

    if (isCurrentlyMove) {
      this.mapCoordinator?.setPhase('updating');
      this.loadActiveTargetIntoSketch(active, undefined);
    } else {
      this.mapCoordinator?.setPhase('quick-move');
      this.loadActiveTargetIntoSketch(active, 'move');
    }
    this.cdr.markForCheck();
  }

  startActiveTargetCenterpoint(): void {
    const active = this.mapCoordinator?.activeTarget();
    if (!active) {
      return;
    }
    this.cancelSketchSafely();
    this.activeEditKind = 'centerpoint';
    this.mapCoordinator?.setPhase('awaiting-centerpoint');
    this.renderAllFeatures(false);
    this.cdr.markForCheck();
  }

  suggestInteriorCenterpoint(): void {
    const active = this.mapCoordinator?.activeTarget();
    if (!active) {
      return;
    }
    const geomVal = parseGeoJsonGeometry(active.formGroup?.get(active.geometryAttr)?.value);
    if (!geomVal) {
      return;
    }
    const esriGeom = this.geoJsonToEsriGeometry(geomVal);
    if (!esriGeom) {
      return;
    }
    const labelPt = labelPointOperator.execute(esriGeom as any);
    if (!labelPt) {
      return;
    }
    const wgs = this.mapXYToWgs84(labelPt.x, labelPt.y);
    const pointGeoJson: GeoJsonPoint = {
      type: 'Point',
      coordinates: [Number(wgs.lng.toFixed(7)), Number(wgs.lat.toFixed(7))],
    };
    this.commitCenterpointAndEnterPinAdjust(active, pointGeoJson, labelPt);
  }

  skipPolygonCenterpoint(): void {
    this.doneEditingTarget();
  }

  clearActiveTarget(): void {
    const active = this.mapCoordinator?.activeTarget();
    this.cancelSketchSafely();
    if (active) {
      this.clearTargetCoordinates(active);
      this.mapCoordinator?.setPhase('drawing');
      this.mapCoordinator?.activeDrawTool.set(null);
    } else {
      this.clearCoordinates();
    }
    this.cdr.markForCheck();
  }

  doneEditingTarget(): void {
    this.activeEditKind = 'geometry';
    this.isSwitchingSketch = true;
    try {
      if (this.sketch && (this.sketch.activeTool || this.sketch.updateGraphics?.length > 0)) {
        this.sketch.complete();
      }
      this.activeEditLayer?.removeAll();
    } catch {
      try {
        this.sketch?.cancel();
      } catch {
        // ignore
      }
    } finally {
      this.isSwitchingSketch = false;
    }
    this.mapCoordinator?.exitEdit();
    this.renderAllFeatures(false);
    this.cdr.markForCheck();
  }

  private commitCenterpointAndEnterPinAdjust(
    target: MapEditTarget,
    pointGeoJson: GeoJsonPoint,
    mapPoint: Point,
  ): void {
    const cpCtrl = target.formGroup?.get(target.centerpointAttr);
    this.isInternalMapUpdate = true;
    try {
      if (cpCtrl) {
        cpCtrl.patchValue(pointGeoJson);
        cpCtrl.markAsDirty();
        cpCtrl.updateValueAndValidity();
      }
    } finally {
      this.isInternalMapUpdate = false;
    }

    this.activeEditKind = 'centerpoint';
    this.mapCoordinator?.setPhase('updating');
    this.renderAllFeatures(false);

    if (this.sketch && this.activeEditLayer) {
      const pinGraphic = new Graphic({
        geometry: new Point({
          x: mapPoint.x,
          y: mapPoint.y,
          spatialReference: this.mapSpatialReference,
        }),
        symbol: new SimpleMarkerSymbol({
          style: 'circle',
          color: '#ff2dc0',
          size: 14,
          outline: { color: '#ffffff', width: 2.5 },
        }),
      });
      this.isSwitchingSketch = true;
      try {
        this.activeEditLayer.removeAll();
        this.activeEditLayer.add(pinGraphic);
      } finally {
        this.isSwitchingSketch = false;
      }
      this.sketch
        .update([pinGraphic], { tool: 'move', toggleToolOnClick: false })
        .catch(() => {});
    }
    this.cdr.markForCheck();
  }

  // --- Saving Graphics to Target FormGroup ---

  private saveCenterpointGraphicToTarget(graphic: Graphic, target: MapEditTarget | null): void {
    const geom = graphic.geometry;
    if (!geom || geom.type !== 'point') {
      return;
    }
    const pt = geom as Point;
    const wgs = this.mapXYToWgs84(pt.x, pt.y);
    const pointGeoJson: GeoJsonPoint = {
      type: 'Point',
      coordinates: [Number(wgs.lng.toFixed(7)), Number(wgs.lat.toFixed(7))],
    };

    const formGroup = target?.formGroup || this.getLocationForm();
    const cpAttr = target?.centerpointAttr || this.mapTool?.centerpoint?.trim() || 'centerpoint';
    const cpCtrl = formGroup?.get(cpAttr);

    this.isInternalMapUpdate = true;
    try {
      if (cpCtrl) {
        cpCtrl.patchValue(pointGeoJson);
        cpCtrl.markAsDirty();
        cpCtrl.updateValueAndValidity();
      }
      this.renderAllFeatures(false);
    } finally {
      this.isInternalMapUpdate = false;
      this.cdr.markForCheck();
    }
  }

  private saveGraphicToTarget(
    graphic: Graphic,
    target: MapEditTarget | null,
    isNewCreation: boolean,
  ): void {
    const geom = graphic.geometry;
    if (!geom) {
      return;
    }

    const formGroup = target?.formGroup || this.getLocationForm();
    const geomAttr = target?.geometryAttr || this.mapTool?.geometry?.trim() || 'geometry';
    const cpAttr = target?.centerpointAttr || this.mapTool?.centerpoint?.trim() || 'centerpoint';

    const geomCtrl = formGroup?.get(geomAttr) || this.getGeometryControl();
    const cpCtrl = formGroup?.get(cpAttr) || this.getCenterpointControl();
    const isEventTarget = !target || target.kind === 'event';
    const eastingCtrl = isEventTarget ? this.getEastingControl() : null;
    const northingCtrl = isEventTarget ? this.getNorthingControl() : null;

    this.isInternalMapUpdate = true;
    try {
      if (geom.type === 'point') {
        const pt = geom as Point;
        const wgs = this.mapXYToWgs84(pt.x, pt.y);
        const pointGeoJson: GeoJsonPoint = {
          type: 'Point',
          coordinates: [Number(wgs.lng.toFixed(7)), Number(wgs.lat.toFixed(7))],
        };

        if (geomCtrl) {
          geomCtrl.patchValue(pointGeoJson);
          geomCtrl.markAsDirty();
          geomCtrl.updateValueAndValidity();
        }
        if (cpCtrl) {
          cpCtrl.patchValue({
            type: 'Point',
            coordinates: [...pointGeoJson.coordinates] as [number, number],
          });
          cpCtrl.markAsDirty();
          cpCtrl.updateValueAndValidity();
        }
        if (eastingCtrl && northingCtrl && this.mapService.isWithinNztmBounds(wgs.lat, wgs.lng)) {
          const nztm = this.mapService.toNZTM(wgs);
          eastingCtrl.patchValue(Math.round(nztm.easting));
          northingCtrl.patchValue(Math.round(nztm.northing));
          eastingCtrl.markAsDirty();
          northingCtrl.markAsDirty();
          eastingCtrl.updateValueAndValidity();
          northingCtrl.updateValueAndValidity();
        }
        if (isEventTarget) {
          this.clearLocationControl();
        }
        this.hasMarker = true;
      } else if (geom.type === 'polyline') {
        const pl = geom as Polyline;
        if (pl.paths?.[0]) {
          const coordinates = pl.paths[0].map((p) => {
            const wgs = this.mapXYToWgs84(p[0], p[1]);
            return [Number(wgs.lng.toFixed(7)), Number(wgs.lat.toFixed(7))];
          });
          const lineGeoJson = {
            type: 'LineString',
            coordinates,
          };

          if (geomCtrl) {
            geomCtrl.patchValue(lineGeoJson);
            geomCtrl.markAsDirty();
            geomCtrl.updateValueAndValidity();
          }
          if (cpCtrl) {
            const midpoint = this.mapService.calculateLineMidpoint(coordinates);
            cpCtrl.patchValue(midpoint);
            cpCtrl.markAsDirty();
            cpCtrl.updateValueAndValidity();
          }
          if (eastingCtrl && northingCtrl) {
            eastingCtrl.patchValue(null);
            northingCtrl.patchValue(null);
            eastingCtrl.markAsDirty();
            northingCtrl.markAsDirty();
            eastingCtrl.updateValueAndValidity();
            northingCtrl.updateValueAndValidity();
          }
          if (isEventTarget) {
            this.clearLocationControl();
          }
          this.hasMarker = true;
        }
      } else if (geom.type === 'polygon') {
        const pg = geom as Polygon;
        if (pg.rings) {
          const coordinates = pg.rings.map((ring) => {
            const pts = ring.map((p) => {
              const wgs = this.mapXYToWgs84(p[0], p[1]);
              return [Number(wgs.lng.toFixed(7)), Number(wgs.lat.toFixed(7))];
            });
            if (pts.length > 0) {
              const first = pts[0];
              const last = pts[pts.length - 1];
              if (first[0] !== last[0] || first[1] !== last[1]) {
                pts.push([first[0], first[1]]);
              }
            }
            return pts;
          });

          const polyGeoJson = {
            type: 'Polygon',
            coordinates,
          };

          if (geomCtrl) {
            geomCtrl.patchValue(polyGeoJson);
            geomCtrl.markAsDirty();
            geomCtrl.updateValueAndValidity();
          }
          // When drawing a brand new Polygon, clear stale centerpoint so Step 2 prompts cleanly.
          // When reshaping an existing Polygon, preserve the user's manual centerpoint.
          if (isNewCreation && cpCtrl && cpCtrl.value !== null) {
            cpCtrl.patchValue(null);
            cpCtrl.markAsDirty();
            cpCtrl.updateValueAndValidity();
          }
          if (eastingCtrl && northingCtrl) {
            eastingCtrl.patchValue(null);
            northingCtrl.patchValue(null);
            eastingCtrl.markAsDirty();
            northingCtrl.markAsDirty();
            eastingCtrl.updateValueAndValidity();
            northingCtrl.updateValueAndValidity();
          }
          if (isEventTarget) {
            this.clearLocationControl();
          }
          this.hasMarker = true;
        }
      }
    } finally {
      this.isInternalMapUpdate = false;
      this.cdr.markForCheck();
    }
  }

  private clearTargetCoordinates(target: MapEditTarget): void {
    const geomCtrl = target.formGroup?.get(target.geometryAttr);
    const cpCtrl = target.formGroup?.get(target.centerpointAttr);
    const isEventTarget = target.kind === 'event';
    const eastingCtrl = isEventTarget ? this.getEastingControl() : null;
    const northingCtrl = isEventTarget ? this.getNorthingControl() : null;

    this.isInternalMapUpdate = true;
    try {
      if (geomCtrl) {
        geomCtrl.patchValue(null);
        geomCtrl.markAsDirty();
        geomCtrl.updateValueAndValidity();
      }
      if (cpCtrl) {
        cpCtrl.patchValue(null);
        cpCtrl.markAsDirty();
        cpCtrl.updateValueAndValidity();
      }
      if (eastingCtrl) {
        eastingCtrl.patchValue(null);
        eastingCtrl.markAsDirty();
        eastingCtrl.updateValueAndValidity();
      }
      if (northingCtrl) {
        northingCtrl.patchValue(null);
        northingCtrl.markAsDirty();
        northingCtrl.updateValueAndValidity();
      }
      if (isEventTarget) {
        this.clearLocationControl();
      }
    } finally {
      this.isInternalMapUpdate = false;
    }

    this.renderAllFeatures(false);
    this.cdr.markForCheck();
  }

  // --- Form Listeners ---

  initFormListeners(): void {
    this.geometryControl = this.getGeometryControl() ?? undefined;
    this.centerpointControl = this.getCenterpointControl() ?? undefined;
    this.eastingControl = this.getEastingControl() ?? undefined;
    this.northingControl = this.getNorthingControl() ?? undefined;

    const locationForm = this.getLocationForm();
    if (locationForm?.controls['location_id']) {
      this.locationControl = locationForm.controls['location_id'];
    }

    if (this.locationControl) {
      this.locationControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.hasInitializedView = false;
        if (this.geometryControl) this.geometryControl.markAsPristine();
        if (this.eastingControl) this.eastingControl.markAsPristine();
        if (this.northingControl) this.northingControl.markAsPristine();
      });
    }

    if (this.mapTool?.placeBinding) {
      const placeCtrlName = this.mapTool.placeBinding.trim();
      let placeCtrl = locationForm?.controls[placeCtrlName];
      if (!placeCtrl && this.ctx?.formMap) {
        for (const form of this.ctx.formMap.values()) {
          if (form instanceof FormGroup && form.controls[placeCtrlName]) {
            placeCtrl = form.controls[placeCtrlName];
            break;
          }
        }
      }
      if (placeCtrl) {
        placeCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((val) => {
          if (val && typeof val === 'object' && val.geometry && this.mapView) {
            try {
              const parsed =
                typeof val.geometry === 'string' ? JSON.parse(val.geometry) : val.geometry;
              if (parsed && parsed.coordinates && parsed.type === 'Point') {
                const [lng, lat] = parsed.coordinates;
                const [x, y] = this.wgs84ToMapXY(lng, lat);
                this.executeGoTo({
                  center: new Point({
                    x,
                    y,
                    spatialReference: this.mapSpatialReference,
                  }),
                  zoom: Math.max(this.zoom, 13),
                });
              }
            } catch (e) {
              console.warn('Error parsing place geometry for map zoom:', e);
            }
          }
        });
      }
    }

    if (this.geometryControl) {
      this.geometryControl.statusChanges
        .pipe(
          takeUntil(this.destroy$),
          map(() => this.geometryControl?.dirty),
          distinctUntilChanged(),
        )
        .subscribe((isDirty) => {
          if (isDirty) {
            this.clearLocationControl();
          }
        });

      this.geometryControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        if (this.isInternalMapUpdate) {
          return;
        }
        this.onGeometryControlChanged();
      });
    }

    if (this.centerpointControl) {
      this.centerpointControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        if (this.isInternalMapUpdate) {
          return;
        }
        if (!this.syncCoordSystemWithData(true)) {
          this.renderAllFeatures(false);
        }
      });
    }

    if (this.eastingControl) {
      this.eastingControl.statusChanges
        .pipe(
          takeUntil(this.destroy$),
          map(() => this.eastingControl?.dirty),
          distinctUntilChanged(),
        )
        .subscribe((isDirty) => {
          if (isDirty) {
            this.clearLocationControl();
          }
        });

      this.eastingControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        if (this.isInternalMapUpdate) {
          return;
        }
        this.onEastingNorthingControlChanged();
      });
    }

    if (this.northingControl) {
      this.northingControl.statusChanges
        .pipe(
          takeUntil(this.destroy$),
          map(() => this.northingControl?.dirty),
          distinctUntilChanged(),
        )
        .subscribe((isDirty) => {
          if (isDirty) {
            this.clearLocationControl();
          }
        });

      this.northingControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        if (this.isInternalMapUpdate) {
          return;
        }
        this.onEastingNorthingControlChanged();
      });
    }

    this.bindOccurrencesListener(this.resolveOccurrencesArray());
    this.updateMapLocation(false);
  }

  private bindOccurrencesListener(occArray: UntypedFormArray | null): void {
    this.occSub?.unsubscribe();
    this.occurrencesArray = occArray ?? undefined;
    this.lastOccurrenceCount = occArray ? occArray.length : -1;
    this.occurrenceCount = occArray ? occArray.length : 0;

    if (occArray) {
      this.occSub = occArray.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.lastOccurrenceCount = occArray.length;
        this.occurrenceCount = occArray.length;
        if (this.isInternalMapUpdate) {
          return;
        }
        if (!this.syncCoordSystemWithData(true)) {
          this.renderAllFeatures(false);
        }
      });
    }
  }

  private onGeometryControlChanged(): void {
    const geoValue = this.getParsedGeometry();
    if (geoValue && geoValue.type && geoValue.coordinates) {
      if (geoValue.type === 'Point') {
        const [lng, lat] = geoValue.coordinates;
        if (this.mapService.isWithinNztmBounds(lat, lng)) {
          const nztm = this.mapService.toNZTM({ lat, lng });
          const easting = Math.round(nztm.easting);
          const northing = Math.round(nztm.northing);

          const eastingCtrl = this.getEastingControl();
          const northingCtrl = this.getNorthingControl();
          if (eastingCtrl && northingCtrl) {
            if (eastingCtrl.value !== easting || northingCtrl.value !== northing) {
              this.isInternalMapUpdate = true;
              try {
                eastingCtrl.patchValue(easting);
                northingCtrl.patchValue(northing);
                eastingCtrl.updateValueAndValidity();
                northingCtrl.updateValueAndValidity();
              } finally {
                this.isInternalMapUpdate = false;
              }
            }
          }
        }
      } else if (geoValue.type === 'LineString' || geoValue.type === 'Polygon') {
        const eastingCtrl = this.getEastingControl();
        const northingCtrl = this.getNorthingControl();
        if (eastingCtrl && northingCtrl) {
          if (eastingCtrl.value !== null || northingCtrl.value !== null) {
            this.isInternalMapUpdate = true;
            try {
              eastingCtrl.patchValue(null);
              northingCtrl.patchValue(null);
              eastingCtrl.updateValueAndValidity();
              northingCtrl.updateValueAndValidity();
            } finally {
              this.isInternalMapUpdate = false;
            }
          }
        }
      }
    }

    if (!this.syncCoordSystemWithData(true)) {
      this.updateMapLocation(false);
    }
  }

  private onEastingNorthingControlChanged(): void {
    const eastingCtrl = this.getEastingControl();
    const northingCtrl = this.getNorthingControl();
    if (!eastingCtrl || !northingCtrl) {
      return;
    }

    const easting = MapToolComponent.toNumber(eastingCtrl.value);
    const northing = MapToolComponent.toNumber(northingCtrl.value);

    if (easting > 0 && northing > 0) {
      const latLng = this.mapService.toLatLng({ easting, northing });
      const pointGeoJson = {
        type: 'Point',
        coordinates: [latLng.lng, latLng.lat],
      };

      const geomCtrl = this.getGeometryControl();
      if (geomCtrl) {
        this.isInternalMapUpdate = true;
        try {
          geomCtrl.patchValue(pointGeoJson);
          geomCtrl.updateValueAndValidity();
        } finally {
          this.isInternalMapUpdate = false;
        }
      }

      this.renderAllFeatures(false);
    } else if (!this.getGeometryControl()?.value) {
      this.renderAllFeatures(false);
    }
  }

  static toNumber(value: any): number {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }
    if (typeof value === 'string') {
      const num = Number(value);
      return Number.isFinite(num) ? num : 0;
    }
    return 0;
  }

  getParsedGeometry(): any {
    const geomCtrl = this.getGeometryControl();
    if (!geomCtrl) {
      return null;
    }
    return parseGeoJsonGeometry(geomCtrl.value);
  }

  updateMapLocation(initialLoad = false, allowAutoZoom = true): void {
    if (!this.eventGraphicsLayer) {
      return;
    }

    const items = this.getItems();
    if (items && items.length > 0) {
      this.syncCoordSystemWithData(allowAutoZoom);
      this.renderMultipleGeometries(items, allowAutoZoom);
      return;
    }

    this.renderAllFeatures(initialLoad && allowAutoZoom);
  }

  // --- Multi-Feature Rendering & Labelling ---

  renderAllFeatures(zoomToExtent = false): void {
    if (!this.eventGraphicsLayer || !this.occurrenceGraphicsLayer) {
      return;
    }

    this.eventGraphicsLayer.removeAll();
    this.occurrenceGraphicsLayer.removeAll();
    this.occurrenceBadgeGraphics = [];
    this.occurrenceAnchors = [];
    this.hasMarker = false;
    this.hasEventLayerData = false;

    const activeTarget = this.mapCoordinator?.activeTarget() ?? null;
    const editPhase = this.mapCoordinator?.editPhase() ?? 'idle';
    const hoveredTarget = this.mapCoordinator?.hoveredTarget() ?? null;
    const isEditing = editPhase !== 'idle' && !!activeTarget;

    const allExtentGraphics: Graphic[] = [];

    // 1. Render Parent Event / Location Layer (Teal underlay)
    const locForm = this.getLocationForm();
    const geomAttr = this.mapTool?.geometry?.trim() || 'geometry';
    const cpAttr = this.mapTool?.centerpoint?.trim() || 'centerpoint';

    let eventGeo = parseGeoJsonGeometry(locForm?.get(geomAttr)?.value ?? this.geometryControl?.value);
    let eventCp = parseGeoJsonGeometry(locForm?.get(cpAttr)?.value ?? this.centerpointControl?.value);

    // Fallback to legacy easting/northing if geometry is absent
    if (!eventGeo) {
      const eastingCtrl = this.getEastingControl();
      const northingCtrl = this.getNorthingControl();
      if (eastingCtrl && northingCtrl) {
        const easting = MapToolComponent.toNumber(eastingCtrl.value);
        const northing = MapToolComponent.toNumber(northingCtrl.value);
        if (easting > 0 && northing > 0) {
          const latLng = this.mapService.toLatLng({ easting, northing });
          eventGeo = { type: 'Point', coordinates: [latLng.lng, latLng.lat] };
        }
      }
    }

    const isEventActiveInSketch =
      isEditing &&
      activeTarget?.kind === 'event' &&
      editPhase !== 'awaiting-centerpoint' &&
      this.activeEditLayer &&
      this.activeEditLayer.graphics.length > 0;

    if (eventGeo) {
      this.hasMarker = true;
      this.hasEventLayerData = true;
      const esriEventGeom = this.geoJsonToEsriGeometry(eventGeo);
      if (esriEventGeom) {
        const isEventHighlighted =
          (activeTarget?.kind === 'event' && editPhase !== 'idle') ||
          hoveredTarget?.kind === 'event';

        if (!isEventActiveInSketch || this.activeEditKind === 'centerpoint') {
          this.addEventGraphics(esriEventGeom, eventCp, isEventHighlighted, allExtentGraphics);
        } else {
          // Track extent using the active edit graphic
          allExtentGraphics.push(new Graphic({ geometry: esriEventGeom }));
        }
      }
    } else if (eventCp && eventCp.type === 'Point') {
      const esriCp = this.geoJsonToEsriGeometry(eventCp);
      if (esriCp) {
        this.hasMarker = true;
        this.hasEventLayerData = true;
        this.addEventCenterpointPin(esriCp as Point, false, allExtentGraphics);
      }
    }

    // 2. Render Occurrences Layer (#1..#N)
    const occArray = this.resolveOccurrencesArray();
    this.occurrenceCount = occArray ? occArray.length : 0;

    if (occArray && occArray.length > 0) {
      for (let i = 0; i < occArray.length; i++) {
        const occForm = occArray.at(i);
        const occGeo = parseGeoJsonGeometry(occForm.get('geometry')?.value);
        const occCp = parseGeoJsonGeometry(occForm.get('centerpoint')?.value);

        const isOccActive =
          isEditing && activeTarget?.kind === 'occurrence' && activeTarget.index === i;
        const isOccHovered = hoveredTarget?.kind === 'occurrence' && hoveredTarget.index === i;
        const isOccInSketch =
          isOccActive &&
          editPhase !== 'awaiting-centerpoint' &&
          this.activeEditKind === 'geometry' &&
          this.activeEditLayer &&
          this.activeEditLayer.graphics.length > 0;

        const isPoly = occGeo?.type === 'Polygon' || occGeo?.type === 'MultiPolygon';
        const isMissingPolyCenter = isPoly && (!occCp || occCp.type !== 'Point');

        let strokeColor: any = '#f59e0b';
        let fillRgba: [number, number, number, number] = [245, 158, 11, 0.2];
        if (isOccActive || isOccHovered) {
          strokeColor = '#ff2dc0';
          fillRgba = [255, 45, 192, 0.28];
        } else if (isMissingPolyCenter) {
          strokeColor = '#dc2626';
          fillRgba = [220, 38, 38, 0.16];
        } else if (isEditing) {
          strokeColor = [245, 158, 11, 0.72];
          fillRgba = [245, 158, 11, 0.12];
        }

        const badgeColor =
          isOccActive || isOccHovered
            ? '#ff2dc0'
            : isMissingPolyCenter
              ? '#dc2626'
              : '#f59e0b';
        const labelText = isMissingPolyCenter ? `${i + 1}!` : `${i + 1}`;
        const attrs = { targetKind: 'occurrence', occurrenceIndex: i };

        let anchorPoint: Point | null = null;

        if (occGeo) {
          const esriGeom = this.geoJsonToEsriGeometry(occGeo);
          if (esriGeom) {
            this.hasMarker = true;

            if (esriGeom.type === 'point') {
              anchorPoint = esriGeom as Point;
              if (isOccInSketch) {
                allExtentGraphics.push(new Graphic({ geometry: esriGeom }));
              }
            } else if (esriGeom.type === 'polyline') {
              if (!isOccInSketch) {
                // White halo casing under polyline for legibility on Topo & Satellite
                const halo = new Graphic({
                  geometry: esriGeom,
                  symbol: new SimpleLineSymbol({ color: '#ffffff', width: 5 }),
                  attributes: attrs,
                });
                const line = new Graphic({
                  geometry: esriGeom,
                  symbol: new SimpleLineSymbol({
                    color: strokeColor as any,
                    width: isOccActive || isOccHovered ? 3.5 : 3,
                  }),
                  attributes: attrs,
                });
                this.occurrenceGraphicsLayer.addMany([halo, line]);
                allExtentGraphics.push(line);
              } else {
                allExtentGraphics.push(new Graphic({ geometry: esriGeom }));
              }

              if (occCp && occCp.type === 'Point') {
                anchorPoint = this.geoJsonToEsriGeometry(occCp) as Point;
              } else {
                const coords =
                  occGeo.type === 'LineString' ? occGeo.coordinates : occGeo.coordinates?.[0];
                const mid = this.mapService.calculateLineMidpoint(coords);
                if (mid) {
                  anchorPoint = this.geoJsonToEsriGeometry(mid) as Point;
                }
              }
            } else if (esriGeom.type === 'polygon') {
              if (!isOccInSketch) {
                const polyGraphic = new Graphic({
                  geometry: esriGeom,
                  symbol: new SimpleFillSymbol({
                    color: fillRgba,
                    outline: {
                      color: strokeColor as any,
                      width: isOccActive || isOccHovered ? 3 : 2.5,
                      style: isMissingPolyCenter ? 'dash' : 'solid',
                    },
                  }),
                  attributes: attrs,
                });
                this.occurrenceGraphicsLayer.add(polyGraphic);
                allExtentGraphics.push(polyGraphic);
              } else {
                allExtentGraphics.push(new Graphic({ geometry: esriGeom }));
              }

              if (occCp && occCp.type === 'Point') {
                anchorPoint = this.geoJsonToEsriGeometry(occCp) as Point;
                // Bullseye pin beneath the #N badge unless currently dragging the centerpoint pin in Sketch
                if (anchorPoint && !(isOccActive && this.activeEditKind === 'centerpoint')) {
                  this.occurrenceGraphicsLayer.add(
                    new Graphic({
                      geometry: anchorPoint,
                      symbol: new SimpleMarkerSymbol({
                        style: 'cross',
                        color: badgeColor,
                        size: 10,
                        outline: { color: badgeColor, width: 2 },
                      }),
                      attributes: attrs,
                    }),
                  );
                }
              } else {
                anchorPoint = labelPointOperator.execute(esriGeom as any);
              }
            }
          }
        } else if (occCp && occCp.type === 'Point') {
          anchorPoint = this.geoJsonToEsriGeometry(occCp) as Point;
          this.hasMarker = true;
        }

        if (anchorPoint) {
          this.occurrenceAnchors.push({
            index: i,
            point: anchorPoint,
            badgeColor,
            labelText,
            isHighlighted: isOccActive || isOccHovered,
          });
          allExtentGraphics.push(new Graphic({ geometry: anchorPoint }));
        }
      }

      this.updateOccurrenceBadges();
    }

    if ((zoomToExtent || !this.hasInitializedView) && allExtentGraphics.length > 0 && this.mapView) {
      this.hasInitializedView = true;
      this.zoomToGraphics(allExtentGraphics);
    }
  }

  private addEventGraphics(
    esriGeom: Point | Polyline | Polygon,
    eventCp: any,
    isHighlighted: boolean,
    extentCollector: Graphic[],
  ): void {
    if (!this.eventGraphicsLayer) {
      return;
    }
    const color = isHighlighted ? '#ff2dc0' : '#0d9488';
    const fillColor: [number, number, number, number] = isHighlighted
      ? [255, 45, 192, 0.22]
      : [13, 148, 136, 0.14];
    const attrs = { targetKind: 'event' };

    if (esriGeom.type === 'point') {
      const pt = esriGeom as Point;
      const circle = new Graphic({
        geometry: pt,
        symbol: new SimpleMarkerSymbol({
          style: 'circle',
          color,
          size: 20,
          outline: { color: '#ffffff', width: 2 },
        }),
        attributes: attrs,
      });
      const text = new Graphic({
        geometry: pt,
        symbol: new TextSymbol({
          text: 'E',
          color: '#ffffff',
          font: { family: 'sans-serif', size: 10, weight: 'bold' },
          verticalAlignment: 'middle',
          horizontalAlignment: 'center',
        }),
        attributes: attrs,
      });
      this.eventGraphicsLayer.addMany([circle, text]);
      extentCollector.push(circle);
    } else if (esriGeom.type === 'polyline') {
      const halo = new Graphic({
        geometry: esriGeom,
        symbol: new SimpleLineSymbol({ color: '#ffffff', width: 5 }),
        attributes: attrs,
      });
      const line = new Graphic({
        geometry: esriGeom,
        symbol: new SimpleLineSymbol({
          color,
          width: isHighlighted ? 3.5 : 2.5,
          style: isHighlighted ? 'solid' : 'dash',
        }),
        attributes: attrs,
      });
      this.eventGraphicsLayer.addMany([halo, line]);
      extentCollector.push(line);

      if (eventCp && eventCp.type === 'Point') {
        const cpPt = this.geoJsonToEsriGeometry(eventCp) as Point;
        if (cpPt) {
          this.addEventCenterpointPin(cpPt, isHighlighted, extentCollector);
        }
      }
    } else if (esriGeom.type === 'polygon') {
      const poly = new Graphic({
        geometry: esriGeom,
        symbol: new SimpleFillSymbol({
          color: fillColor,
          outline: {
            color,
            width: isHighlighted ? 3 : 2.5,
            style: isHighlighted ? 'solid' : 'dash',
          },
        }),
        attributes: attrs,
      });
      this.eventGraphicsLayer.add(poly);
      extentCollector.push(poly);

      if (eventCp && eventCp.type === 'Point') {
        const cpPt = this.geoJsonToEsriGeometry(eventCp) as Point;
        if (cpPt) {
          this.addEventCenterpointPin(cpPt, isHighlighted, extentCollector);
        }
      }
    }
  }

  private addEventCenterpointPin(
    cpPt: Point,
    isHighlighted: boolean,
    extentCollector: Graphic[],
  ): void {
    if (!this.eventGraphicsLayer) {
      return;
    }
    const color = isHighlighted ? '#ff2dc0' : '#0d9488';
    const attrs = { targetKind: 'event' };
    const circle = new Graphic({
      geometry: cpPt,
      symbol: new SimpleMarkerSymbol({
        style: 'circle',
        color,
        size: 16,
        outline: { color: '#ffffff', width: 2 },
      }),
      attributes: attrs,
    });
    const text = new Graphic({
      geometry: cpPt,
      symbol: new TextSymbol({
        text: 'E',
        color: '#ffffff',
        font: { family: 'sans-serif', size: 9, weight: 'bold' },
        verticalAlignment: 'middle',
        horizontalAlignment: 'center',
      }),
      attributes: attrs,
    });
    this.eventGraphicsLayer.addMany([circle, text]);
    extentCollector.push(circle);
  }

  /**
   * Renders Occurrence #1..#N circle badges and deconflicts closely clustered markers
   * within <= 18px screen space using radial fan-out with leader lines.
   */
  private updateOccurrenceBadges(): void {
    if (!this.occurrenceGraphicsLayer) {
      return;
    }

    if (this.occurrenceBadgeGraphics.length > 0) {
      this.occurrenceGraphicsLayer.removeMany(this.occurrenceBadgeGraphics);
      this.occurrenceBadgeGraphics = [];
    }

    if (this.occurrenceAnchors.length === 0) {
      return;
    }

    const canProjectToScreen = !!(
      this.mapView &&
      this.mapView.ready &&
      this.mapView.extent &&
      typeof this.mapView.toScreen === 'function' &&
      typeof this.mapView.toMap === 'function'
    );

    if (!canProjectToScreen || this.occurrenceAnchors.length === 1) {
      for (const anchor of this.occurrenceAnchors) {
        this.addBadgeAtPoint(anchor, anchor.point);
      }
      return;
    }

    interface ProjectedAnchor {
      anchor: OccurrenceAnchor;
      sx: number;
      sy: number;
    }

    const projected: ProjectedAnchor[] = [];
    const unprojected: OccurrenceAnchor[] = [];

    for (const anchor of this.occurrenceAnchors) {
      try {
        const screenPt = this.mapView!.toScreen(anchor.point);
        if (screenPt && Number.isFinite(screenPt.x) && Number.isFinite(screenPt.y)) {
          projected.push({ anchor, sx: screenPt.x, sy: screenPt.y });
        } else {
          unprojected.push(anchor);
        }
      } catch {
        unprojected.push(anchor);
      }
    }

    for (const anchor of unprojected) {
      this.addBadgeAtPoint(anchor, anchor.point);
    }

    const visited = new Array(projected.length).fill(false);
    const thresholdSq = 18 * 18;

    for (let i = 0; i < projected.length; i++) {
      if (visited[i]) continue;
      visited[i] = true;
      const cluster: ProjectedAnchor[] = [projected[i]];

      for (let j = i + 1; j < projected.length; j++) {
        if (visited[j]) continue;
        const dx = projected[j].sx - projected[i].sx;
        const dy = projected[j].sy - projected[i].sy;
        if (dx * dx + dy * dy <= thresholdSq) {
          visited[j] = true;
          cluster.push(projected[j]);
        }
      }

      if (cluster.length === 1) {
        this.addBadgeAtPoint(cluster[0].anchor, cluster[0].anchor.point);
      } else {
        const cx = cluster.reduce((sum, p) => sum + p.sx, 0) / cluster.length;
        const cy = cluster.reduce((sum, p) => sum + p.sy, 0) / cluster.length;
        const radiusPx = Math.max(22, cluster.length * 6);

        for (let k = 0; k < cluster.length; k++) {
          const item = cluster[k];
          const angle = (2 * Math.PI * k) / cluster.length - Math.PI / 2;
          const fx = cx + radiusPx * Math.cos(angle);
          const fy = cy + radiusPx * Math.sin(angle);
          const fannedMapPt = this.mapView!.toMap({ x: fx, y: fy });

          if (fannedMapPt) {
            const leader = new Graphic({
              geometry: new Polyline({
                paths: [
                  [
                    [item.anchor.point.x, item.anchor.point.y],
                    [fannedMapPt.x, fannedMapPt.y],
                  ],
                ],
                spatialReference: this.mapSpatialReference,
              }),
              symbol: new SimpleLineSymbol({
                color: '#334155',
                width: 1.5,
                style: 'short-dot',
              }),
              attributes: {
                targetKind: 'occurrence',
                occurrenceIndex: item.anchor.index,
              },
            });
            this.occurrenceBadgeGraphics.push(leader);
            this.occurrenceGraphicsLayer.add(leader);
            this.addBadgeAtPoint(item.anchor, fannedMapPt);
          } else {
            this.addBadgeAtPoint(item.anchor, item.anchor.point);
          }
        }
      }
    }
  }

  private addBadgeAtPoint(anchor: OccurrenceAnchor, pt: Point): void {
    if (!this.occurrenceGraphicsLayer) {
      return;
    }
    const attrs = {
      targetKind: 'occurrence',
      occurrenceIndex: anchor.index,
    };

    const circle = new Graphic({
      geometry: pt,
      symbol: new SimpleMarkerSymbol({
        style: 'circle',
        color: anchor.badgeColor,
        size: anchor.isHighlighted ? 26 : 22,
        outline: {
          color: '#ffffff',
          width: anchor.isHighlighted ? 2.5 : 2,
        },
      }),
      attributes: attrs,
    });

    const text = new Graphic({
      geometry: pt,
      symbol: new TextSymbol({
        text: anchor.labelText,
        color: '#ffffff',
        font: {
          family: 'sans-serif',
          size: anchor.labelText.length > 2 ? 9 : 11,
          weight: 'bold',
        },
        verticalAlignment: 'middle',
        horizontalAlignment: 'center',
      }),
      attributes: attrs,
    });

    this.occurrenceBadgeGraphics.push(circle, text);
    this.occurrenceGraphicsLayer.addMany([circle, text]);
  }

  private zoomToGraphics(graphics: Graphic[]): void {
    if (!this.mapView || graphics.length === 0) {
      return;
    }
    if (graphics.length === 1) {
      const geom = graphics[0].geometry;
      if (geom?.type === 'point') {
        this.executeGoTo(
          { center: geom as Point, zoom: Math.max(this.zoom, 12) },
          { animate: false },
        );
        return;
      }
      if (geom && (geom as any).extent) {
        this.executeGoTo((geom as any).extent.expand(1.3), { animate: false });
        return;
      }
    }
    this.executeGoTo(graphics, { animate: false });
  }

  panMapToTarget(target: MapEditTarget): void {
    if (!this.mapView) {
      return;
    }
    const geo =
      parseGeoJsonGeometry(target.formGroup?.get(target.geometryAttr)?.value) ||
      parseGeoJsonGeometry(target.formGroup?.get(target.centerpointAttr)?.value);
    if (!geo) {
      return;
    }
    const esriGeom = this.geoJsonToEsriGeometry(geo);
    if (!esriGeom) {
      return;
    }

    // Only pan/zoom if geometry lies outside current viewport
    if (this.mapView.extent) {
      try {
        if (esriGeom.type === 'point' && this.mapView.extent.contains(esriGeom as Point)) {
          return;
        }
        if (esriGeom.extent && this.mapView.extent.contains(esriGeom.extent)) {
          return;
        }
      } catch {
        // proceed with goTo
      }
    }

    if (esriGeom.type === 'point') {
      this.executeGoTo({
        center: esriGeom as Point,
        zoom: Math.max(this.mapView.zoom || this.zoom, 13),
      });
    } else if (esriGeom.extent) {
      this.executeGoTo(esriGeom.extent.expand(1.3));
    }
  }

  geoJsonToEsriGeometry(geo: any): Point | Polyline | Polygon | null {
    const parsed = parseGeoJsonGeometry(geo);
    if (!parsed || !parsed.type || !parsed.coordinates) {
      return null;
    }

    if (parsed.type === 'Point') {
      const [lng, lat] = parsed.coordinates;
      const [x, y] = this.wgs84ToMapXY(lng, lat);
      return new Point({ x, y, spatialReference: this.mapSpatialReference });
    }

    if (parsed.type === 'LineString') {
      const paths = [
        parsed.coordinates.map((c: [number, number]) => this.wgs84ToMapXY(c[0], c[1])),
      ];
      return new Polyline({ paths, spatialReference: this.mapSpatialReference });
    }

    if (parsed.type === 'MultiLineString') {
      const paths = parsed.coordinates.map((line: [number, number][]) =>
        line.map((c) => this.wgs84ToMapXY(c[0], c[1])),
      );
      return new Polyline({ paths, spatialReference: this.mapSpatialReference });
    }

    if (parsed.type === 'Polygon') {
      const rings = parsed.coordinates.map((ring: [number, number][]) =>
        ring.map((c) => this.wgs84ToMapXY(c[0], c[1])),
      );
      return new Polygon({ rings, spatialReference: this.mapSpatialReference });
    }

    if (parsed.type === 'MultiPolygon') {
      const rings: number[][][] = [];
      for (const poly of parsed.coordinates) {
        if (Array.isArray(poly)) {
          for (const ring of poly) {
            rings.push(ring.map((c: [number, number]) => this.wgs84ToMapXY(c[0], c[1])));
          }
        }
      }
      return new Polygon({ rings, spatialReference: this.mapSpatialReference });
    }

    return null;
  }

  // --- Legacy & Click Handlers ---

  clearCoordinates(): void {
    const geomCtrl = this.getGeometryControl();
    const cpCtrl = this.getCenterpointControl();
    const eastingCtrl = this.getEastingControl();
    const northingCtrl = this.getNorthingControl();

    this.isInternalMapUpdate = true;
    try {
      if (geomCtrl) {
        geomCtrl.patchValue(null);
        geomCtrl.markAsDirty();
        geomCtrl.updateValueAndValidity();
      }
      if (cpCtrl) {
        cpCtrl.patchValue(null);
        cpCtrl.markAsDirty();
        cpCtrl.updateValueAndValidity();
      }
      if (eastingCtrl) {
        eastingCtrl.patchValue(null);
        eastingCtrl.markAsDirty();
        eastingCtrl.updateValueAndValidity();
      }
      if (northingCtrl) {
        northingCtrl.patchValue(null);
        northingCtrl.markAsDirty();
        northingCtrl.updateValueAndValidity();
      }
      this.clearLocationControl();
    } finally {
      this.isInternalMapUpdate = false;
    }
    this.renderAllFeatures(false);
    this.cdr.markForCheck();
  }

  doEditorAction(): void {
    this.propertySheetService.edit('Map', this.mapTool);
  }

  clearLocationControl(): void {
    if (this.locationControl) {
      this.locationControl.patchValue(null);
    }
  }

  onMapClick(event: any): void {
    const editMode = this.ctx && this.ctx.mode === 'edit';
    const currentPhase = this.mapCoordinator?.editPhase() ?? 'idle';

    // Step 2 of Two-Step Polygon Flow: map-canvas click places centerpoint without blocking UI outside the map
    if (editMode && currentPhase === 'awaiting-centerpoint' && event?.mapPoint) {
      const target = this.mapCoordinator?.activeTarget();
      if (target) {
        const wgs = this.mapXYToWgs84(event.mapPoint.x, event.mapPoint.y);
        const pointGeoJson: GeoJsonPoint = {
          type: 'Point',
          coordinates: [Number(wgs.lng.toFixed(7)), Number(wgs.lat.toFixed(7))],
        };
        this.commitCenterpointAndEnterPinAdjust(
          target,
          pointGeoJson,
          event.mapPoint as Point,
        );
        return;
      }
    }

    const shiftKeyPressed = !!event?.native?.shiftKey;

    // Shift+Click quick shortcut for dropping a point at the current cursor location without resetting zoom
    if (editMode && shiftKeyPressed && event.mapPoint) {
      const target = this.ensureActiveTarget();
      const formGroup = target?.formGroup || this.getLocationForm();
      const geomAttr = target?.geometryAttr || this.mapTool?.geometry?.trim() || 'geometry';
      const cpAttr = target?.centerpointAttr || this.mapTool?.centerpoint?.trim() || 'centerpoint';

      const geomCtrl = formGroup?.get(geomAttr) || this.getGeometryControl();
      const cpCtrl = formGroup?.get(cpAttr) || this.getCenterpointControl();
      const isEventTarget = !target || target.kind === 'event';
      const eastingCtrl = isEventTarget ? this.getEastingControl() : null;
      const northingCtrl = isEventTarget ? this.getNorthingControl() : null;

      const wgs = this.mapXYToWgs84(event.mapPoint.x, event.mapPoint.y);
      const pointGeoJson: GeoJsonPoint = {
        type: 'Point',
        coordinates: [Number(wgs.lng.toFixed(7)), Number(wgs.lat.toFixed(7))],
      };

      this.isInternalMapUpdate = true;
      try {
        if (geomCtrl) {
          geomCtrl.patchValue(pointGeoJson);
          geomCtrl.markAsDirty();
          geomCtrl.updateValueAndValidity();
        }
        if (cpCtrl) {
          cpCtrl.patchValue({
            type: 'Point',
            coordinates: [...pointGeoJson.coordinates] as [number, number],
          });
          cpCtrl.markAsDirty();
          cpCtrl.updateValueAndValidity();
        }
        if (eastingCtrl && northingCtrl && this.mapService.isWithinNztmBounds(wgs.lat, wgs.lng)) {
          const nztm = this.mapService.toNZTM(wgs);
          eastingCtrl.patchValue(Math.round(nztm.easting));
          northingCtrl.patchValue(Math.round(nztm.northing));
          eastingCtrl.markAsDirty();
          northingCtrl.markAsDirty();
          eastingCtrl.updateValueAndValidity();
          northingCtrl.updateValueAndValidity();
        }
        if (isEventTarget) {
          this.clearLocationControl();
        }
      } finally {
        this.isInternalMapUpdate = false;
        this.cdr.markForCheck();
      }

      this.renderAllFeatures(false);
      return;
    }

    // Bidirectional focus: clicking an Occurrence graphic/#N badge or Event graphic highlights and scrolls to its form section
    const focusLayers = [
      this.occurrenceGraphicsLayer,
      this.eventGraphicsLayer,
    ].filter((l): l is GraphicsLayer => !!l);
    if (this.mapView && focusLayers.length > 0 && currentPhase === 'idle') {
      this.mapView
        .hitTest(event, { include: focusLayers })
        .then((hitResp: any) => {
          this.ngZone.run(() => {
            const occHit = hitResp?.results?.find(
              (r: any) =>
                r.type === 'graphic' &&
                r.graphic?.attributes?.targetKind === 'occurrence' &&
                typeof r.graphic.attributes.occurrenceIndex === 'number',
            );
            if (occHit) {
              this.mapCoordinator?.focusCard(occHit.graphic.attributes.occurrenceIndex);
              return;
            }
            const eventHit = hitResp?.results?.find(
              (r: any) =>
                r.type === 'graphic' &&
                r.graphic?.attributes?.targetKind === 'event',
            );
            if (eventHit) {
              this.mapCoordinator?.focusEvent();
              return;
            }
            this.hitTestReferenceLayers(event);
          });
        })
        .catch(() => {
          this.hitTestReferenceLayers(event);
        });
      return;
    }

    this.hitTestReferenceLayers(event);
  }

  private hitTestReferenceLayers(event: any): void {
    if (!this.mapView || !this.referenceFeatureLayers?.length) {
      return;
    }
    const selectableLayers = this.referenceFeatureLayers
      .filter((r) => r.config.selectable !== false)
      .map((r) => r.layer);

    if (selectableLayers.length === 0) {
      return;
    }

    this.mapView
      .hitTest(event, { include: selectableLayers })
      .then((response: any) => {
        this.ngZone.run(() => {
          if (response.results?.length > 0) {
            const hit = response.results.find((r: any) => r.type === 'graphic' && r.graphic);
            if (hit && hit.graphic) {
              this.handleReferenceFeatureSelected(hit.graphic);
            }
          }
        });
      })
      .catch((err: any) => {
        console.warn('hitTest error:', err);
      });
  }

  private handleReferenceFeatureSelected(graphic: Graphic): void {
    if (!this.mapTool?.placeBinding) {
      return;
    }

    const placeCtrlName = this.mapTool.placeBinding.trim();
    const locationForm = this.getLocationForm();
    let placeControl = locationForm?.controls[placeCtrlName];
    if (!placeControl && this.ctx?.formMap) {
      for (const form of this.ctx.formMap.values()) {
        if (form instanceof FormGroup && form.controls[placeCtrlName]) {
          placeControl = form.controls[placeCtrlName];
          break;
        }
      }
    }

    const attrs = graphic.attributes || {};
    const placeName =
      attrs.name ||
      attrs.NAME ||
      attrs.Name ||
      attrs.FACILITY_NAME ||
      attrs.track_name ||
      attrs.TITLE ||
      (attrs.OBJECTID ? 'Place #' + attrs.OBJECTID : '');

    if (placeControl) {
      if (typeof placeControl.value === 'object' && placeControl.value !== null) {
        placeControl.patchValue({
          ...placeControl.value,
          id: attrs.gis_geometry_id || attrs.OBJECTID,
          name: placeName,
        });
      } else {
        placeControl.patchValue(placeName);
      }
      placeControl.markAsDirty();
      placeControl.updateValueAndValidity();
      this.cdr.markForCheck();
    }
  }

  renderMultipleGeometries(items: any[], zoomToExtent = true): void {
    if (!this.eventGraphicsLayer || !items || items.length === 0) {
      this.eventGraphicsLayer?.removeAll();
      this.occurrenceGraphicsLayer?.removeAll();
      this.hasMarker = false;
      return;
    }

    this.eventGraphicsLayer.removeAll();
    this.occurrenceGraphicsLayer?.removeAll();
    this.hasMarker = false;

    const geomAttr = this.mapTool?.geometry || 'geometry';
    const cpAttr = this.mapTool?.centerpoint || 'centerpoint';

    for (const item of items) {
      let geo = MapToolComponent.resolveProperty(item, geomAttr);
      if (!geo) {
        geo = item.location?.geometry ?? item.geometry ?? item.location_geometry;
      }
      geo = parseGeoJsonGeometry(geo);

      // Fallback to centerpoint (or legacy easting/northing) if geometry is absent
      if (!geo || !geo.coordinates) {
        let cp = MapToolComponent.resolveProperty(item, cpAttr);
        if (!cp) {
          cp = item.location?.centerpoint ?? item.location_centerpoint ?? item.centerpoint;
        }
        geo = parseGeoJsonGeometry(cp);
      }

      if (!geo || !geo.coordinates) {
        const easting =
          MapToolComponent.resolveProperty(item, this.mapTool?.easting) ??
          item.location?.easting ??
          item.easting;
        const northing =
          MapToolComponent.resolveProperty(item, this.mapTool?.northing) ??
          item.location?.northing ??
          item.northing;

        if (easting && northing) {
          const eNum = MapToolComponent.toNumber(easting);
          const nNum = MapToolComponent.toNumber(northing);
          if (eNum > 0 && nNum > 0) {
            const latLng = this.mapService.toLatLng({ easting: eNum, northing: nNum });
            geo = {
              type: 'Point',
              coordinates: [latLng.lng, latLng.lat],
            };
          }
        }
      }

      if (!geo || !geo.type || !geo.coordinates) {
        continue;
      }

      try {
        const popupTemplate = this.createPopupTemplate(item);
        const esriGeom = this.geoJsonToEsriGeometry(geo);
        if (!esriGeom) {
          continue;
        }

        if (esriGeom.type === 'point') {
          const symbol = new SimpleMarkerSymbol({
            style: 'circle',
            color: '#0d6efd',
            size: 10,
            outline: { color: '#ffffff', width: 1.5 },
          });
          this.eventGraphicsLayer.add(
            new Graphic({ geometry: esriGeom, symbol, attributes: item, popupTemplate }),
          );
          this.hasMarker = true;
        } else if (esriGeom.type === 'polyline') {
          const symbol = new SimpleLineSymbol({ color: '#6f42c1', width: 3 });
          this.eventGraphicsLayer.add(
            new Graphic({ geometry: esriGeom, symbol, attributes: item, popupTemplate }),
          );
          this.hasMarker = true;
        } else if (esriGeom.type === 'polygon') {
          const symbol = new SimpleFillSymbol({
            color: [253, 126, 20, 0.25],
            outline: { color: '#fd7e14', width: 2 },
          });
          this.eventGraphicsLayer.add(
            new Graphic({ geometry: esriGeom, symbol, attributes: item, popupTemplate }),
          );
          this.hasMarker = true;
        }
      } catch (e) {
        console.warn('Error rendering item geometry in map:', e);
      }
    }

    if (zoomToExtent && this.eventGraphicsLayer.graphics.length > 0 && this.mapView) {
      this.zoomToGraphics(this.eventGraphicsLayer.graphics.toArray());
    }
  }

  getMetaEntityName(): string {
    return (
      this.mapTool?.metaEntityName ||
      this.ctx?.metaEntity?.name ||
      this.ctx?.metaName ||
      (this.ctx?.metaPage?.templates &&
        this.ctx.metaPage.templates.find((t) => t.metaEntityName)?.metaEntityName) ||
      'CaptureEvent'
    );
  }

  formatDate(dateValue: any): string {
    if (!dateValue) return '';
    try {
      const pattern = this.stackConfig?.dateFormat || 'dd-MMM-yyyy';
      const formatter = DateTimeFormatter.ofPattern(pattern).withLocale(Locale.US);
      const zoneId = ZoneId.of('Pacific/Auckland');

      let zdt: ZonedDateTime;
      if (typeof dateValue === 'string') {
        if (
          dateValue.includes('+') ||
          dateValue.endsWith('Z') ||
          (dateValue.includes('-') && dateValue.lastIndexOf('-') > 10)
        ) {
          zdt = ZonedDateTime.parse(dateValue).withZoneSameInstant(zoneId);
        } else {
          const normalized = dateValue.replace(' ', 'T') + 'Z';
          zdt = ZonedDateTime.parse(normalized).withZoneSameInstant(zoneId);
        }
      } else if (dateValue instanceof Date) {
        zdt = ZonedDateTime.parse(dateValue.toISOString()).withZoneSameInstant(zoneId);
      } else {
        return String(dateValue);
      }
      return formatter.format(zdt);
    } catch (e) {
      console.warn('Error formatting date in MapToolComponent:', e);
      return String(dateValue);
    }
  }

  resolveDetailsUrl(item: any): string | null {
    if (!item || this.mapTool?.navigation === 'Disabled') {
      return null;
    }

    const entityId = item.id || item.entity_id;
    if (!entityId) {
      return null;
    }

    if (this.mapTool?.route) {
      let url = this.mapTool.route;
      url = url.replace('${id}', String(entityId));
      url = url.replace('${entity_id}', String(entityId));
      for (const key of Object.keys(item)) {
        if (url.includes(`\${${key}}`)) {
          url = url.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), String(item[key] ?? ''));
        }
      }
      return url;
    }

    let targetEntity = this.mapTool?.targetMetaEntityName;
    if (!targetEntity) {
      if (item.meta_entity_name || item.metaEntityName) {
        targetEntity = item.meta_entity_name || item.metaEntityName;
      } else if (
        this.mapTool?.metaEntityName &&
        this.mapTool.metaEntityName.endsWith('SearchResult')
      ) {
        targetEntity = this.mapTool.metaEntityName.substring(
          0,
          this.mapTool.metaEntityName.length - 'SearchResult'.length,
        );
      } else {
        targetEntity = this.getMetaEntityName();
      }
    }

    return `/data/${targetEntity}/view/${entityId}`;
  }

  private createPopupTemplate(item: any): any {
    const title =
      item.field_number ||
      item.name ||
      item.title ||
      (item.id ? 'Item ' + String(item.id).substring(0, 8) : 'Result');
    const detailsUrl = this.resolveDetailsUrl(item);
    const entityId = item.id || item.entity_id;

    return {
      title: String(title),
      content: () => {
        const div = document.createElement('div');
        div.className = 'p-1';
        if (item.event_type) {
          const typeDiv = document.createElement('div');
          typeDiv.innerHTML = `<strong>Event Type:</strong> ${item.event_type}`;
          div.appendChild(typeDiv);
        }
        const place = item.place_name || item.location?.place_name || item.location_place_name;
        if (place) {
          const placeDiv = document.createElement('div');
          placeDiv.innerHTML = `<strong>Place:</strong> ${place}`;
          div.appendChild(placeDiv);
        }
        if (item.event_begin_date) {
          const dateDiv = document.createElement('div');
          dateDiv.innerHTML = `<strong>Date:</strong> ${this.formatDate(item.event_begin_date)}`;
          div.appendChild(dateDiv);
        }
        if (detailsUrl) {
          const btnDiv = document.createElement('div');
          btnDiv.className = 'mt-2';
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'btn btn-sm btn-primary text-white';
          btn.setAttribute('data-url', detailsUrl);
          if (entityId) {
            btn.setAttribute('data-entity-id', String(entityId));
          }
          btn.innerText = 'View Details';
          btn.onclick = (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            this.ngZone.run(() => {
              this.router.navigateByUrl(detailsUrl);
            });
          };
          btnDiv.appendChild(btn);
          div.appendChild(btnDiv);
        }
        return div;
      },
      actions: detailsUrl
        ? [
            {
              id: 'view-details',
              title: 'View Details',
              className: 'esri-icon-launch-link-external',
            },
          ]
        : [],
    };
  }

  private initReferenceLayers(): void {
    if (!this.map || !this.mapTool?.referenceLayers?.length) {
      return;
    }

    this.referenceFeatureLayers = [];

    for (const layerConfig of this.mapTool.referenceLayers) {
      if (!layerConfig.url) continue;

      const initialVisible =
        layerConfig.id in this.referenceLayerVisibility
          ? this.referenceLayerVisibility[layerConfig.id]
          : layerConfig.visible !== false;

      const featureLayer = new FeatureLayer({
        id: layerConfig.id,
        title: layerConfig.title || layerConfig.id,
        url: layerConfig.url,
        minScale: layerConfig.minScale ?? 0,
        maxScale: layerConfig.maxScale ?? 0,
        visible: initialVisible,
        outFields: ['*'],
      });

      if (this.eventGraphicsLayer) {
        const idx = this.map.layers.indexOf(this.eventGraphicsLayer);
        if (idx >= 0) {
          this.map.layers.add(featureLayer, idx);
        } else {
          this.map.add(featureLayer);
        }
      } else {
        this.map.add(featureLayer);
      }

      this.referenceFeatureLayers.push({ layer: featureLayer, config: layerConfig });
    }

    this.initLayerToggleWidget();
  }

  private initLayerToggleWidget(): void {
    if (!this.mapView || !this.referenceFeatureLayers.length) {
      return;
    }

    const container = document.createElement('div');
    container.className = 'esri-widget p-3 bg-white shadow-sm esri-layer-toggle-container';
    container.setAttribute('data-testid', 'layer-toggle-container');
    container.style.minWidth = '220px';
    container.style.maxWidth = '300px';

    const title = document.createElement('div');
    title.className = 'fw-bold mb-2 small text-uppercase text-secondary border-bottom pb-1';
    title.innerText = 'Reference Layers';
    container.appendChild(title);

    for (const { layer, config } of this.referenceFeatureLayers) {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'form-check form-switch mb-2';

      const input = document.createElement('input');
      input.className = 'form-check-input';
      input.type = 'checkbox';
      input.id = 'layer-toggle-' + config.id;
      input.setAttribute('data-testid', 'layer-toggle-checkbox-' + config.id);
      input.checked = layer.visible;

      input.addEventListener('change', () => {
        this.ngZone.run(() => {
          layer.visible = input.checked;
          this.referenceLayerVisibility[config.id] = input.checked;
        });
      });

      const label = document.createElement('label');
      label.className = 'form-check-label small user-select-none';
      label.htmlFor = 'layer-toggle-' + config.id;
      label.innerText = config.title || config.id;
      label.setAttribute('data-testid', 'layer-toggle-label-' + config.id);

      itemDiv.appendChild(input);
      itemDiv.appendChild(label);
      container.appendChild(itemDiv);
    }

    this.expandWidget = new Expand({
      view: this.mapView,
      content: container,
      expandIcon: 'layers',
      expandTooltip: 'Reference Layers',
    });

    if (this.expandWidget.container && typeof this.expandWidget.container === 'object') {
      (this.expandWidget.container as HTMLElement).setAttribute(
        'data-testid',
        'layer-toggle-expand',
      );
    }

    this.mapView.ui.add(this.expandWidget, 'top-left');
  }
}
