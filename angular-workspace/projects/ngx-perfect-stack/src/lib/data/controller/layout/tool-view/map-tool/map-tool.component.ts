import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {FormContext} from '../../../../data-edit/form-service/form.service';
import {MapTool} from '../../../../../domain/meta.page';
import {PropertySheetService} from '../../../../../template/property-sheet/property-sheet.service';
import {MapAttributionService} from './map-attribution.service';
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';
import type { ResourceHandle } from "@arcgis/core/core/Handles";
import {AbstractControl, FormGroup} from '@angular/forms';
import {MapService} from './map.service';
import {distinctUntilChanged, map, Subject, takeUntil} from 'rxjs';

import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import TileLayer from '@arcgis/core/layers/TileLayer';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import Polyline from '@arcgis/core/geometry/Polyline';
import Polygon from '@arcgis/core/geometry/Polygon';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import SimpleLineSymbol from '@arcgis/core/symbols/SimpleLineSymbol';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import Sketch from '@arcgis/core/widgets/Sketch';

export const LINZ_MAP_SERVICE_URL = 'https://services1.arcgisonline.co.nz/arcgis/rest/services/LINZ/geotiffs/MapServer';

@Component({
  selector: 'lib-map-tool',
  templateUrl: './map-tool.component.html',
  styleUrls: ['./map-tool.component.css'],
  standalone: false
})
export class MapToolComponent implements OnInit, AfterViewInit, OnDestroy {

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

  @ViewChild('mapContainer', { static: false })
  mapContainer?: ElementRef<HTMLDivElement>;

  mapView?: MapView;
  graphicsLayer?: GraphicsLayer;
  tileLayer?: TileLayer;
  map?: Map;
  sketch?: Sketch;

  hasMarker = false;
  private hasInitializedView = false;
  private isInternalMapUpdate = false;

  geometryControl?: AbstractControl;
  eastingControl?: AbstractControl;
  northingControl?: AbstractControl;
  locationControl?: AbstractControl;

  private attributionHandle?: ResourceHandle;

  private destroy$ = new Subject<void>();

  constructor(
    protected readonly mapService: MapService,
    protected readonly propertySheetService: PropertySheetService,
    protected readonly ngZone: NgZone,
    protected readonly cdr: ChangeDetectorRef,
    protected readonly attributionService: MapAttributionService
  ) {}

  ngOnInit(): void {
    this.initFormListeners();
  }

  ngAfterViewInit(): void {
    if (this.editorMode) {
      return;
    }
    this.initMap();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.attributionHandle) {
      this.attributionHandle.remove();
    }
    this.attributionService.clearAttribution();
    if (this.sketch) {
      this.sketch.destroy();
    }
    if (this.mapView) {
      this.mapView.destroy();
    }
  }

  hasGeometryBinding(): boolean {
    return !!(this.mapTool?.geometry && typeof this.mapTool.geometry === 'string' && this.mapTool.geometry.trim().length > 0);
  }

  hasEastingBinding(): boolean {
    return !!(this.mapTool?.easting && typeof this.mapTool.easting === 'string' && this.mapTool.easting.trim().length > 0);
  }

  hasNorthingBinding(): boolean {
    return !!(this.mapTool?.northing && typeof this.mapTool.northing === 'string' && this.mapTool.northing.trim().length > 0);
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

    let locationForm = this.ctx.formMap.get('location') as FormGroup;
    if (!locationForm) {
      locationForm = this.ctx.formMap.get('event') as FormGroup;
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

    if (!locationForm) {
      console.warn('UNABLE to find a form to update with location coordinates');
    }

    return locationForm;
  }

  private initMap(): void {
    if (!this.mapContainer?.nativeElement) {
      return;
    }

    this.tileLayer = new TileLayer({ url: LINZ_MAP_SERVICE_URL });

    this.graphicsLayer = new GraphicsLayer();

    this.map = new Map({
      layers: [this.tileLayer, this.graphicsLayer]
    });

    const defaultNZTM = this.mapService.toNZTM({ lat: -41.20588830649284, lng: 174.91502957335638 });

    this.mapView = new MapView({
      container: this.mapContainer.nativeElement,
      map: this.map,
      center: new Point({
        x: defaultNZTM.easting,
        y: defaultNZTM.northing,
        spatialReference: { wkid: 2193 }
      }),
      zoom: this.zoom,
      attributionVisible: false
    });

    this.mapView.attributionVisible = false;
    this.mapView.ui.components = ['zoom'];

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
      { initial: true }
    );

    this.mapView.on('click', (event: any) => {
      this.ngZone.run(() => {
        this.onMapClick(event);
      });
    });

    this.mapView.when(() => {
      this.ngZone.run(() => {
        this.updateMapLocation(true);
        if (this.ctx && this.ctx.mode === 'edit') {
          this.initSketch();
        }
      });
    });
  }

  private initSketch(): void {
    if (!this.mapView || !this.graphicsLayer) {
      return;
    }

    this.sketch = new Sketch({
      view: this.mapView,
      layer: this.graphicsLayer,
      creationMode: 'update',
      visibleElements: {
        createTools: {
          point: true,
          polyline: true,
          polygon: true,
          circle: false,
          rectangle: false,
          multipoint: false
        },
        selectionTools: {
          'lasso-selection': false,
          'rectangle-selection': false
        },
        settingsMenu: false
      }
    });

    const pointSymbol = new SimpleMarkerSymbol({
      style: 'circle',
      color: '#ff2dc0',
      size: 12,
      outline: { color: '#ff2dc0', width: 1 }
    });

    const polylineSymbol = new SimpleLineSymbol({
      color: '#ff2dc0',
      width: 3
    });

    const polygonSymbol = new SimpleFillSymbol({
      color: [255, 45, 192, 0.3],
      outline: { color: '#ff2dc0', width: 3 }
    });

    this.sketch.viewModel.pointSymbol = pointSymbol;
    this.sketch.viewModel.polylineSymbol = polylineSymbol;
    this.sketch.viewModel.polygonSymbol = polygonSymbol;
    this.sketch.viewModel.activeFillSymbol = polygonSymbol;

    this.mapView.ui.add(this.sketch, 'top-right');

    this.sketch.on('create', (event: any) => {
      this.ngZone.run(() => {
        if (event.tool === 'polyline' || event.tool === 'polygon') {
          const eastingCtrl = this.getEastingControl();
          const northingCtrl = this.getNorthingControl();
          if (eastingCtrl && eastingCtrl.value !== null) {
            this.isInternalMapUpdate = true;
            try {
              eastingCtrl.patchValue(null);
              eastingCtrl.markAsDirty();
              eastingCtrl.updateValueAndValidity();
            } finally {
              this.isInternalMapUpdate = false;
            }
          }
          if (northingCtrl && northingCtrl.value !== null) {
            this.isInternalMapUpdate = true;
            try {
              northingCtrl.patchValue(null);
              northingCtrl.markAsDirty();
              northingCtrl.updateValueAndValidity();
            } finally {
              this.isInternalMapUpdate = false;
            }
          }
        }

        if (event.state === 'complete' && event.graphic) {
          // Keep only the newly created graphic
          const others = this.graphicsLayer?.graphics.filter(g => g !== event.graphic).toArray() || [];
          if (others.length > 0) {
            this.graphicsLayer?.removeMany(others);
          }
          this.saveGraphicToForm(event.graphic);
        }
      });
    });

    this.sketch.on('update', (event: any) => {
      this.ngZone.run(() => {
        if (event.graphics?.length > 0) {
          this.saveGraphicToForm(event.graphics[0]);
        }
      });
    });

    this.sketch.on('delete', () => {
      this.ngZone.run(() => {
        this.clearCoordinates();
      });
    });
  }

  private saveGraphicToForm(graphic: Graphic): void {
    const geomCtrl = this.getGeometryControl();
    const eastingCtrl = this.getEastingControl();
    const northingCtrl = this.getNorthingControl();

    const geom = graphic.geometry;
    if (!geom) {
      return;
    }

    this.isInternalMapUpdate = true;
    try {
      if (geom.type === 'point') {
        const pt = geom as Point;
        const easting = Math.round(pt.x);
        const northing = Math.round(pt.y);
        const latLng = this.mapService.toLatLng({ easting, northing });

        const pointGeoJson = {
          type: 'Point',
          coordinates: [latLng.lng, latLng.lat]
        };

        if (geomCtrl) {
          geomCtrl.patchValue(pointGeoJson);
          geomCtrl.markAsDirty();
          geomCtrl.updateValueAndValidity();
        }

        if (eastingCtrl) {
          eastingCtrl.patchValue(easting);
          eastingCtrl.markAsDirty();
          eastingCtrl.updateValueAndValidity();
        }
        if (northingCtrl) {
          northingCtrl.patchValue(northing);
          northingCtrl.markAsDirty();
          northingCtrl.updateValueAndValidity();
        }

        this.clearLocationControl();
        this.hasMarker = true;
      } else if (geom.type === 'polyline') {
        const pl = geom as Polyline;
        if (pl.paths?.[0]) {
          const coordinates = pl.paths[0].map(p => {
            const latLng = this.mapService.toLatLng({ easting: p[0], northing: p[1] });
            return [latLng.lng, latLng.lat];
          });

          const lineGeoJson = {
            type: 'LineString',
            coordinates
          };

          if (geomCtrl) {
            geomCtrl.patchValue(lineGeoJson);
            geomCtrl.markAsDirty();
            geomCtrl.updateValueAndValidity();
          }

          // If line or polygon is selected/changed, easting and northing must be null
          if (eastingCtrl && northingCtrl) {
            eastingCtrl.patchValue(null);
            northingCtrl.patchValue(null);
            eastingCtrl.markAsDirty();
            northingCtrl.markAsDirty();
            eastingCtrl.updateValueAndValidity();
            northingCtrl.updateValueAndValidity();
          }

          this.clearLocationControl();
          this.hasMarker = true;
        }
      } else if (geom.type === 'polygon') {
        const pg = geom as Polygon;
        if (pg.rings) {
          const coordinates = pg.rings.map(ring => {
            const pts = ring.map(p => {
              const latLng = this.mapService.toLatLng({ easting: p[0], northing: p[1] });
              return [latLng.lng, latLng.lat];
            });
            // Ensure linear ring is closed (first and last points match)
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
            coordinates
          };

          if (geomCtrl) {
            geomCtrl.patchValue(polyGeoJson);
            geomCtrl.markAsDirty();
            geomCtrl.updateValueAndValidity();
          }

          // If line or polygon is selected/changed, easting and northing must be null
          if (eastingCtrl && northingCtrl) {
            eastingCtrl.patchValue(null);
            northingCtrl.patchValue(null);
            eastingCtrl.markAsDirty();
            northingCtrl.markAsDirty();
            eastingCtrl.updateValueAndValidity();
            northingCtrl.updateValueAndValidity();
          }

          this.clearLocationControl();
          this.hasMarker = true;
        }
      }
    } finally {
      this.isInternalMapUpdate = false;
      this.cdr.markForCheck();
    }
  }

  initFormListeners(): void {
    this.geometryControl = this.getGeometryControl() ?? undefined;
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

    if (this.geometryControl) {
      this.geometryControl.statusChanges.pipe(
        takeUntil(this.destroy$),
        map(() => this.geometryControl?.dirty),
        distinctUntilChanged()
      ).subscribe(isDirty => {
        if (isDirty) {
          this.clearLocationControl();
        }
      });

      this.geometryControl.valueChanges.pipe(
        takeUntil(this.destroy$)
      ).subscribe(() => {
        if (this.isInternalMapUpdate) {
          return;
        }
        this.onGeometryControlChanged();
      });
    }

    if (this.eastingControl) {
      this.eastingControl.statusChanges.pipe(
        takeUntil(this.destroy$),
        map(() => this.eastingControl?.dirty),
        distinctUntilChanged()
      ).subscribe(isDirty => {
        if (isDirty) {
          this.clearLocationControl();
        }
      });

      this.eastingControl.valueChanges.pipe(
        takeUntil(this.destroy$)
      ).subscribe(() => {
        if (this.isInternalMapUpdate) {
          return;
        }
        this.onEastingNorthingControlChanged();
      });
    }

    if (this.northingControl) {
      this.northingControl.statusChanges.pipe(
        takeUntil(this.destroy$),
        map(() => this.northingControl?.dirty),
        distinctUntilChanged()
      ).subscribe(isDirty => {
        if (isDirty) {
          this.clearLocationControl();
        }
      });

      this.northingControl.valueChanges.pipe(
        takeUntil(this.destroy$)
      ).subscribe(() => {
        if (this.isInternalMapUpdate) {
          return;
        }
        this.onEastingNorthingControlChanged();
      });
    }

    this.updateMapLocation(false);
  }

  private onGeometryControlChanged(): void {
    const geoValue = this.getParsedGeometry();
    if (geoValue && geoValue.type && geoValue.coordinates) {
      if (geoValue.type === 'Point') {
        const [lng, lat] = geoValue.coordinates;
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
      } else if (geoValue.type === 'LineString' || geoValue.type === 'Polygon') {
        // Line or Polygon: set easting and northing to null
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
    this.updateMapLocation(false);
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
        coordinates: [latLng.lng, latLng.lat]
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

      this.renderPoint(easting, northing, false);
    } else {
      if (!this.getGeometryControl()?.value) {
        this.graphicsLayer?.removeAll();
        this.hasMarker = false;
      }
    }
  }

  private renderPoint(easting: number, northing: number, initialLoad = false): void {
    if (!this.graphicsLayer) {
      return;
    }
    this.graphicsLayer.removeAll();

    const point = new Point({
      x: easting,
      y: northing,
      spatialReference: { wkid: 2193 }
    });
    const symbol = new SimpleMarkerSymbol({
      style: 'circle',
      color: '#ff2dc0',
      size: 12,
      outline: { color: '#ff2dc0', width: 1 }
    });
    this.graphicsLayer.add(new Graphic({ geometry: point, symbol }));
    this.hasMarker = true;

    if (initialLoad || !this.hasInitializedView) {
      this.hasInitializedView = true;
      this.mapView?.goTo({ center: point, zoom: this.zoom }, { animate: false }).catch(() => {});
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
    let val = geomCtrl.value;
    if (typeof val === 'string' && val.trim().length > 0) {
      try {
        val = JSON.parse(val);
      } catch (e) {
        val = null;
      }
    }
    return val && typeof val === 'object' && val.type ? val : null;
  }

  updateMapLocation(initialLoad = false): void {
    if (!this.graphicsLayer) {
      return;
    }

    this.graphicsLayer.removeAll();
    this.hasMarker = false;

    const geomCtrl = this.getGeometryControl();
    const eastingCtrl = this.getEastingControl();
    const northingCtrl = this.getNorthingControl();

    // 1. Check Geometry attribute first
    const geoValue = this.getParsedGeometry();
    if (geoValue && geoValue.type && geoValue.coordinates) {
      try {
        if (geoValue.type === 'Point') {
          const [lng, lat] = geoValue.coordinates;
          const nztm = this.mapService.toNZTM({ lat, lng });
          const point = new Point({
            x: nztm.easting,
            y: nztm.northing,
            spatialReference: { wkid: 2193 }
          });
          const symbol = new SimpleMarkerSymbol({
            style: 'circle',
            color: '#ff2dc0',
            size: 12,
            outline: { color: '#ff2dc0', width: 1 }
          });
          this.graphicsLayer.add(new Graphic({ geometry: point, symbol }));
          this.hasMarker = true;

          // Keep easting/northing in sync if present
          if (eastingCtrl && northingCtrl && !this.isInternalMapUpdate) {
            const easting = Math.round(nztm.easting);
            const northing = Math.round(nztm.northing);
            if (eastingCtrl.value !== easting || northingCtrl.value !== northing) {
              this.isInternalMapUpdate = true;
              try {
                eastingCtrl.patchValue(easting);
                northingCtrl.patchValue(northing);
              } finally {
                this.isInternalMapUpdate = false;
              }
            }
          }

          // Only center/zoom on initial load
          if (initialLoad || !this.hasInitializedView) {
            this.hasInitializedView = true;
            this.mapView?.goTo({ center: point, zoom: this.zoom }, { animate: false }).catch(() => {});
          }
          return;
        } else if (geoValue.type === 'LineString') {
          const paths = [
            geoValue.coordinates.map((c: [number, number]) => {
              const n = this.mapService.toNZTM({ lat: c[1], lng: c[0] });
              return [n.easting, n.northing];
            })
          ];
          const polyline = new Polyline({
            paths,
            spatialReference: { wkid: 2193 }
          });
          const symbol = new SimpleLineSymbol({
            color: '#ff2dc0',
            width: 3
          });
          this.graphicsLayer.add(new Graphic({ geometry: polyline, symbol }));
          this.hasMarker = true;

          // Only center/zoom on initial load
          if (initialLoad || !this.hasInitializedView) {
            this.hasInitializedView = true;
            if (polyline.extent && this.mapView) {
              this.mapView.goTo(polyline.extent.expand(1.3), { animate: false }).catch(() => {});
            }
          }
          return;
        } else if (geoValue.type === 'Polygon') {
          const rings = geoValue.coordinates.map((ring: [number, number][]) =>
            ring.map(c => {
              const n = this.mapService.toNZTM({ lat: c[1], lng: c[0] });
              return [n.easting, n.northing];
            })
          );
          const polygon = new Polygon({
            rings,
            spatialReference: { wkid: 2193 }
          });
          const symbol = new SimpleFillSymbol({
            color: [255, 45, 192, 0.3],
            outline: {
              color: '#ff2dc0',
              width: 3
            }
          });
          this.graphicsLayer.add(new Graphic({ geometry: polygon, symbol }));
          this.hasMarker = true;

          // Only center/zoom on initial load
          if (initialLoad || !this.hasInitializedView) {
            this.hasInitializedView = true;
            if (polygon.extent && this.mapView) {
              this.mapView.goTo(polygon.extent.expand(1.3), { animate: false }).catch(() => {});
            }
          }
          return;
        }
      } catch (e) {
        console.error('Error rendering GeoJSON graphic:', e);
      }
    }

    // 2. Fallback to easting/northing if geometry is not set
    if (eastingCtrl && northingCtrl) {
      const easting = MapToolComponent.toNumber(eastingCtrl.value);
      const northing = MapToolComponent.toNumber(northingCtrl.value);

      if (easting > 0 && northing > 0) {
        this.renderPoint(easting, northing, initialLoad);

        // Auto-populate geometryControl if geometry is not set
        if (geomCtrl && !geomCtrl.value) {
          const latLng = this.mapService.toLatLng({ easting, northing });
          const pointGeoJson = {
            type: 'Point',
            coordinates: [latLng.lng, latLng.lat]
          };
          this.isInternalMapUpdate = true;
          try {
            geomCtrl.patchValue(pointGeoJson);
          } finally {
            this.isInternalMapUpdate = false;
          }
        }
      }
    }
  }

  clearCoordinates(): void {
    const geomCtrl = this.getGeometryControl();
    const eastingCtrl = this.getEastingControl();
    const northingCtrl = this.getNorthingControl();

    this.isInternalMapUpdate = true;
    try {
      if (geomCtrl) {
        geomCtrl.patchValue(null);
        geomCtrl.markAsDirty();
        geomCtrl.updateValueAndValidity();
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
      if (this.graphicsLayer) {
        this.graphicsLayer.removeAll();
      }
      this.hasMarker = false;
    } finally {
      this.isInternalMapUpdate = false;
      this.cdr.markForCheck();
    }
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
    const shiftKeyPressed = !!(event?.native?.shiftKey);

    // Shift+Click quick shortcut for dropping a point at the current cursor location without resetting zoom
    if (editMode && shiftKeyPressed && event.mapPoint) {
      const geomCtrl = this.getGeometryControl();
      const eastingCtrl = this.getEastingControl();
      const northingCtrl = this.getNorthingControl();

      const easting = Math.round(event.mapPoint.x);
      const northing = Math.round(event.mapPoint.y);
      const latLng = this.mapService.toLatLng({ easting, northing });

      const pointGeoJson = {
        type: 'Point',
        coordinates: [latLng.lng, latLng.lat]
      };

      this.isInternalMapUpdate = true;
      try {
        if (geomCtrl) {
          geomCtrl.patchValue(pointGeoJson);
          geomCtrl.markAsDirty();
          geomCtrl.updateValueAndValidity();
        }

        if (eastingCtrl && northingCtrl) {
          eastingCtrl.patchValue(easting);
          northingCtrl.patchValue(northing);
          eastingCtrl.markAsDirty();
          northingCtrl.markAsDirty();
          eastingCtrl.updateValueAndValidity();
          northingCtrl.updateValueAndValidity();
        }

        this.clearLocationControl();
      } finally {
        this.isInternalMapUpdate = false;
        this.cdr.markForCheck();
      }

      this.updateMapLocation(false);
    }
  }
}
