import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormContext} from '../../../../data-edit/form-service/form.service';
import {MapTool} from '../../../../../domain/meta.page';
import {circleMarker, geoJSON, latLng, LeafletMouseEvent, tileLayer} from 'leaflet';
import {PropertySheetService} from '../../../../../template/property-sheet/property-sheet.service';
import {AbstractControl, FormGroup} from '@angular/forms';
import {MapService} from './map.service';
import {distinctUntilChanged, map, Subject, takeUntil} from 'rxjs';

@Component({
  selector: 'lib-map-tool',
  templateUrl: './map-tool.component.html',
  styleUrls: ['./map-tool.component.css'],
  standalone: false
})
export class MapToolComponent implements OnInit, OnDestroy {

  @Input()
  mapTool: MapTool;

  @Input()
  ctx: FormContext;

  @Input()
  editorMode = false;

  @Input()
  height = '300px';

  @Input()
  zoom = 10;

  options: any = null;
  center = latLng(-41.20588830649284, 174.91502957335638);
  baseLayers = {
    'tileLayer': tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: 'OpenStreetMap' }),
  };

  layers: any[] = [];

  drawMode: 'Point' | 'LineString' | 'Polygon' = 'Point';
  drawingCoords: [number, number][] = [];

  geometryControl?: AbstractControl;
  eastingControl?: AbstractControl;
  northingControl?: AbstractControl;
  locationControl?: AbstractControl;

  private destroy$ = new Subject<void>();

  constructor(
    protected readonly mapService: MapService,
    protected readonly propertySheetService: PropertySheetService
  ) {}

  ngOnInit(): void {
    this.initFormListeners();
    this.options = { zoom: this.zoom, center: this.center };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initFormListeners() {
    const locationForm = this.getLocationForm();
    if (!locationForm) {
      return;
    }

    if (this.mapTool.geometry) {
      this.geometryControl = locationForm.controls[this.mapTool.geometry];
    }

    if (this.mapTool.easting) {
      this.eastingControl = locationForm.controls[this.mapTool.easting];
    }

    if (this.mapTool.northing) {
      this.northingControl = locationForm.controls[this.mapTool.northing];
    }

    this.locationControl = locationForm.controls['location_id'];
    if (this.locationControl) {
      this.locationControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        if (this.geometryControl) this.geometryControl.markAsPristine();
        if (this.eastingControl) this.eastingControl.markAsPristine();
        if (this.northingControl) this.northingControl.markAsPristine();
      });
    }

    if (this.geometryControl) {
      // Sync draw mode if geometry already has a known type
      const currentVal = this.getParsedGeometry();
      if (currentVal && ['Point', 'LineString', 'Polygon'].includes(currentVal.type)) {
        this.drawMode = currentVal.type;
      }

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
        this.updateMapLocation();
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
        if (!this.geometryControl?.value) {
          this.updateMapLocation();
        }
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
        if (!this.geometryControl?.value) {
          this.updateMapLocation();
        }
      });
    }

    this.updateMapLocation();
  }

  static toNumber(value: any): number {
    // Handle actual numbers first
    if (typeof value === 'number') {
      // Ensure the number is finite (not NaN or Infinity)
      return Number.isFinite(value) ? value : 0;
    }

    // Handle strings
    if (typeof value === 'string') {
      // Number() can parse strings with leading/trailing whitespace.
      // It converts an empty string or whitespace-only string to 0.
      // For non-numeric strings like "abc" or "123px", Number() returns NaN.
      const num = Number(value);
      // Ensure the parsed number is finite
      return Number.isFinite(num) ? num : 0;
    }

    // For all other types (boolean, object, null, undefined, etc.),
    // return 0 as they are not directly number or string representations of numbers.
    return 0;
  }

  getParsedGeometry(): any {
    if (!this.geometryControl) {
      return null;
    }
    let val = this.geometryControl.value;
    if (typeof val === 'string' && val.trim().length > 0) {
      try {
        val = JSON.parse(val);
      } catch (e) {
        val = null;
      }
    }
    return val && typeof val === 'object' && val.type ? val : null;
  }

  updateMapLocation() {
    this.layers = [];

    // Temporary preview while drawing LineString with 1 vertex
    if (this.drawMode === 'LineString' && this.drawingCoords.length === 1) {
      const coord = this.drawingCoords[0];
      this.layers.push(
        circleMarker(latLng(coord[1], coord[0]), {
          radius: 5,
          color: '#ff2dc0',
          fill: true,
          fillOpacity: 1.0,
          fillColor: '#ff2dc0'
        })
      );
      return;
    }

    // Temporary preview while drawing Polygon with 1 or 2 vertices
    if (this.drawMode === 'Polygon' && this.drawingCoords.length === 1) {
      const coord = this.drawingCoords[0];
      this.layers.push(
        circleMarker(latLng(coord[1], coord[0]), {
          radius: 5,
          color: '#ff2dc0',
          fill: true,
          fillOpacity: 1.0,
          fillColor: '#ff2dc0'
        })
      );
      return;
    } else if (this.drawMode === 'Polygon' && this.drawingCoords.length === 2) {
      const gLayer = geoJSON({
        type: 'LineString',
        coordinates: this.drawingCoords
      } as any, {
        style: () => ({ color: '#ff2dc0', weight: 3, opacity: 0.9 })
      });
      this.layers.push(gLayer);
      return;
    }

    // 1. Check Geometry attribute first
    const geoValue = this.getParsedGeometry();
    if (geoValue && geoValue.type && geoValue.coordinates) {
      try {
        const gLayer = geoJSON(geoValue, {
          pointToLayer: (_feature, latlng) => {
            return circleMarker(latlng, {
              radius: 6,
              color: '#ff2dc0',
              fill: true,
              fillOpacity: 1.0,
              fillColor: '#ff2dc0'
            });
          },
          style: () => ({
            color: '#ff2dc0',
            weight: 3,
            opacity: 0.9,
            fillColor: '#ff2dc0',
            fillOpacity: 0.3
          })
        });

        this.layers.push(gLayer);

        const bounds = gLayer.getBounds();
        if (bounds.isValid()) {
          this.center = bounds.getCenter();
        }
        return;
      } catch (e) {
        console.error('Error rendering GeoJSON layer:', e);
      }
    }

    // 2. Fallback to easting/northing if geometry is not set
    if (this.eastingControl && this.northingControl) {
      const easting = MapToolComponent.toNumber(this.eastingControl.value);
      const northing = MapToolComponent.toNumber(this.northingControl.value);

      if (easting > 0 && northing > 0) {
        this.center = this.mapService.toLatLng({ easting, northing });
        this.layers.push(
          circleMarker(this.center, {
            radius: 5,
            color: '#ff2dc0',
            fill: true,
            fillOpacity: 1.0,
            fillColor: '#ff2dc0'
          })
        );
      }
    }
  }

  setDrawMode(mode: 'Point' | 'LineString' | 'Polygon') {
    this.drawMode = mode;
    this.drawingCoords = [];
    const currentVal = this.getParsedGeometry();
    if (currentVal && currentVal.type === mode && Array.isArray(currentVal.coordinates)) {
      if (mode === 'LineString') {
        this.drawingCoords = [...currentVal.coordinates];
      } else if (mode === 'Polygon' && currentVal.coordinates[0]) {
        const ring = currentVal.coordinates[0];
        this.drawingCoords = ring.length > 1 ? ring.slice(0, ring.length - 1) : [...ring];
      }
    }
  }

  finishDrawing() {
    this.drawingCoords = [];
    this.updateMapLocation();
  }

  clearCoordinates() {
    this.drawingCoords = [];
    if (this.geometryControl) {
      this.geometryControl.patchValue(null);
      this.geometryControl.markAsDirty();
    }
    if (this.eastingControl) {
      this.eastingControl.patchValue(null);
      this.eastingControl.markAsDirty();
    }
    if (this.northingControl) {
      this.northingControl.patchValue(null);
      this.northingControl.markAsDirty();
    }
    this.clearLocationControl();
    this.layers = [];
  }

  doEditorAction() {
    this.propertySheetService.edit('Map', this.mapTool);
  }

  getLocationForm(): FormGroup | null {
    if (!this.ctx?.formMap) {
      return null;
    }

    let locationForm = this.ctx.formMap.get('location') as FormGroup;
    if (!locationForm) {
      locationForm = this.ctx.formMap.get('event') as FormGroup;
    }

    if (!locationForm) {
      for (const form of this.ctx.formMap.values()) {
        if (form instanceof FormGroup) {
          if (
            (this.mapTool.geometry && form.controls[this.mapTool.geometry]) ||
            (this.mapTool.easting && form.controls[this.mapTool.easting])
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

  clearLocationControl() {
    if (this.locationControl) {
      this.locationControl.patchValue(null);
    }
  }

  onMapClick(event: LeafletMouseEvent) {
    const editMode = this.ctx && this.ctx.mode === 'edit';
    const shiftKeyPressed = event.originalEvent.shiftKey;

    if (editMode && shiftKeyPressed) {
      console.log(`Map Click at: ${event.latlng}`);

      if (this.drawMode === 'Point') {
        const pointGeoJson = {
          type: 'Point',
          coordinates: [event.latlng.lng, event.latlng.lat]
        };

        if (this.geometryControl) {
          this.geometryControl.patchValue(pointGeoJson);
          this.geometryControl.markAsDirty();
        }

        // Dual-binding: update easting/northing from WGS84 point
        if (this.eastingControl && this.northingControl) {
          const nztm = this.mapService.toNZTM(event.latlng);
          this.eastingControl.patchValue(nztm.easting);
          this.northingControl.patchValue(nztm.northing);
          this.eastingControl.markAsDirty();
          this.northingControl.markAsDirty();
        }

        this.clearLocationControl();
        this.updateMapLocation();
      } else if (this.drawMode === 'LineString') {
        this.drawingCoords.push([event.latlng.lng, event.latlng.lat]);
        if (this.drawingCoords.length >= 2) {
          const lineGeoJson = {
            type: 'LineString',
            coordinates: [...this.drawingCoords]
          };
          if (this.geometryControl) {
            this.geometryControl.patchValue(lineGeoJson);
            this.geometryControl.markAsDirty();
          }
        }
        this.clearLocationControl();
        this.updateMapLocation();
      } else if (this.drawMode === 'Polygon') {
        this.drawingCoords.push([event.latlng.lng, event.latlng.lat]);
        if (this.drawingCoords.length >= 3) {
          const ring = [...this.drawingCoords, this.drawingCoords[0]];
          const polyGeoJson = {
            type: 'Polygon',
            coordinates: [ring]
          };
          if (this.geometryControl) {
            this.geometryControl.patchValue(polyGeoJson);
            this.geometryControl.markAsDirty();
          }
        }
        this.clearLocationControl();
        this.updateMapLocation();
      }
    }
  }
}
