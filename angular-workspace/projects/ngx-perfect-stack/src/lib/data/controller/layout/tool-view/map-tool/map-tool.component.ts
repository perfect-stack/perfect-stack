import {Component, Input, OnInit} from '@angular/core';
import {FormContext} from '../../../../data-edit/form-service/form.service';
import {MapTool} from '../../../../../domain/meta.page';
import {circleMarker, latLng, LeafletMouseEvent, tileLayer} from 'leaflet';
import {PropertySheetService} from '../../../../../template/property-sheet/property-sheet.service';
import {AbstractControl, FormGroup} from '@angular/forms';
import {MapService} from './map.service';
import {distinctUntilChanged, map, Subject, takeUntil} from "rxjs";

@Component({
    selector: 'lib-map-tool',
    templateUrl: './map-tool.component.html',
    styleUrls: ['./map-tool.component.css'],
    standalone: false
})
export class MapToolComponent implements OnInit {

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
  }

  layers: any[] = [];

  eastingControl: AbstractControl;
  northingControl: AbstractControl;
  locationControl: AbstractControl;

  private destroy$ = new Subject<void>();

  constructor(protected readonly mapService: MapService,
              protected readonly propertySheetService: PropertySheetService) { }

  ngOnInit(): void {
    this.initFormListeners();
    this.options = { zoom: this.zoom, center: this.center };
  }

  initFormListeners() {
    const eastingAttributeName = this.mapTool.easting;
    const northingAttributeName = this.mapTool.northing;
    const locationForm = this.getLocationForm();
    if(eastingAttributeName && northingAttributeName && locationForm) {
      this.eastingControl = locationForm.controls[eastingAttributeName];
      this.northingControl = locationForm.controls[northingAttributeName];

      // May or may not find this...
      this.locationControl = locationForm.controls['location_id'];

      if(this.eastingControl && this.northingControl) {
        // pump the current location into the map at the start
        this.updateMapLocation();

        // AND, listen for future changes
        /*this.eastingControl.valueChanges.subscribe(() => {
          this.clearLocationControl();
          this.updateMapLocation();
        });

        this.northingControl.valueChanges.subscribe(() => {
          this.clearLocationControl();
          this.updateMapLocation();
        });*/

        // --- Easting Control Listeners ---

        // This stream clears the location ONLY when the control becomes dirty
        this.eastingControl.statusChanges.pipe(
          takeUntil(this.destroy$),
          map(() => this.eastingControl.dirty), // Get the current dirty state
          distinctUntilChanged()                // IMPORTANT: Only emit when it changes (e.g., false -> true)
        ).subscribe(isDirty => {
          if (isDirty) {
            // This block now only runs ONCE when the user first edits the field.
            this.clearLocationControl();
          }
        });

        // This stream updates the map on ANY value change
        this.eastingControl.valueChanges.pipe(
          takeUntil(this.destroy$)
        ).subscribe(() => {
          this.updateMapLocation();
        });


        // --- Northing Control Listeners ---

        // This stream clears the location ONLY when the control becomes dirty
        this.northingControl.statusChanges.pipe(
          takeUntil(this.destroy$),
          map(() => this.northingControl.dirty),
          distinctUntilChanged()
        ).subscribe(isDirty => {
          if (isDirty) {
            this.clearLocationControl();
          }
        });

        // This stream updates the map on ANY value change
        this.northingControl.valueChanges.pipe(
          takeUntil(this.destroy$)
        ).subscribe(() => {
          this.updateMapLocation();
        });


      }
    }
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

  updateMapLocation() {
    if(this.eastingControl && this.northingControl) {
      let easting = MapToolComponent.toNumber(this.eastingControl.value);
      let northing = MapToolComponent.toNumber(this.northingControl.value);

      if(easting > 0 && northing > 0) {
        console.log(`Move map to location; (${easting}, ${northing})`, easting, northing)
        this.center = this.mapService.toLatLng({easting: easting, northing: northing});

        this.layers = [];
        this.layers.push(
          circleMarker(
            this.center,
            {
              radius: 5,
              color: '#ff2dc0',
              fill: true,
              fillOpacity: 1.0,
              fillColor: '#ff2dc0'
            }),
        );
      }
    }
  }

  doEditorAction() {
    // trigger the PropertySheetService to start editing it
    this.propertySheetService.edit('Map', this.mapTool);
  }

  getLocationForm() {
    let locationForm = this.ctx.formMap.get('location') as FormGroup;

    if(!locationForm) {
      locationForm = this.ctx.formMap.get('event') as FormGroup;
    }

    if(!locationForm) {
      console.warn('UNABLE to find a form to update with location coordinates');
    }

    return locationForm;
  }

  clearLocationControl() {
    // After the form has been initialized whenever the user changes the Location coordinates by entering a number
    // or by clicking on the map. Then we need to clear the OneToMany location (if defined) because user initiated
    // map clicks don't update the related Location entity coordinates.
    if(this.locationControl) {
      console.log('Clear Location control');
      this.locationControl.patchValue(null);
    }
    else {
      console.log('Location control is not defined');
    }
  }


  onMapClick(event: LeafletMouseEvent) {
    const editMode = this.ctx.mode === 'edit';
    const shiftKeyPressed = event.originalEvent.shiftKey;
    if(editMode && shiftKeyPressed) {
      console.log(`Map Click at: ${event.latlng}`);

      const nztm = this.mapService.toNZTM(event.latlng);
      console.log(`Map Click converted to; ${nztm.easting}, ${nztm.northing}`);

      if(this.eastingControl && this.northingControl) {
        this.eastingControl.patchValue(nztm.easting);
        this.northingControl.patchValue(nztm.northing);
      }

      this.clearLocationControl();
    }
  }
}
