import {Component, Input, OnInit} from '@angular/core';
import {FormContext} from '../../../../data-edit/form-service/form.service';
import {MapTool} from '../../../../../domain/meta.page';
import {circleMarker, latLng, LeafletMouseEvent, tileLayer} from 'leaflet';
import {PropertySheetService} from '../../../../../template/property-sheet/property-sheet.service';
import {FormGroup} from '@angular/forms';
import {MapService} from './map.service';

@Component({
  selector: 'lib-map-tool',
  templateUrl: './map-tool.component.html',
  styleUrls: ['./map-tool.component.css']
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

  constructor(protected readonly mapService: MapService,
              protected readonly propertySheetService: PropertySheetService) { }

  ngOnInit(): void {
    this.updateLocation();
    this.options = { zoom: this.zoom, center: this.center };
  }

  updateLocation() {
    const eastingAttribute = this.mapTool.easting;
    const northingAttribute = this.mapTool.northing;
    const locationForm = this.getLocationForm();
    if(eastingAttribute && northingAttribute && locationForm) {
      let easting = locationForm.controls[eastingAttribute].value;
      let northing = locationForm.controls[northingAttribute].value;

      if(!(easting && northing)) {
        const eventResult = this.ctx.dataMap.get('event');
        if(eventResult && eventResult.result && eventResult.result.location) {
          const location = eventResult.result.location;
          easting = location.easting;
          northing = location.northing;
        }
      }

      if(easting && northing) {
        console.log(`Move map to location; (${easting}, ${northing})`)
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
      locationForm = this.ctx.formMap.get('nestAttempt') as FormGroup;
    }

    if(!locationForm) {
      locationForm = this.ctx.formMap.get('event') as FormGroup;
    }

    if(!locationForm) {
      console.warn('UNABLE to find a form to update with location coordinates');
    }

    return locationForm;
  }


  onMapClick(event: LeafletMouseEvent) {
    const editMode = this.ctx.mode === 'edit';
    const shiftKeyPressed = event.originalEvent.shiftKey;
    if(editMode && shiftKeyPressed) {
      console.log(`Map Click at: ${event.latlng}`);
      const nztm = this.mapService.toNZTM(event.latlng);
      console.log(`Converted to; ${nztm.easting}, ${nztm.northing}`);

      const eastingAttribute = this.mapTool.easting;
      const northingAttribute = this.mapTool.northing;
      const locationForm = this.getLocationForm();
      if(eastingAttribute && northingAttribute && locationForm) {
        locationForm.controls[eastingAttribute].patchValue(nztm.easting);
        locationForm.controls[northingAttribute].patchValue(nztm.northing);

        this.updateLocation();
      }
    }
  }
}
