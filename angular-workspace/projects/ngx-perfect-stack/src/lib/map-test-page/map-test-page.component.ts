import { Component, OnInit } from '@angular/core';
import {circle, latLng, polygon, tileLayer} from 'leaflet';

import * as proj4 from 'proj4';

@Component({
  selector: 'lib-map-test-page',
  templateUrl: './map-test-page.component.html',
  styleUrls: ['./map-test-page.component.css']
})
export class MapTestPageComponent implements OnInit {

  options = {
    layers: [
      tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '...' })
    ],
    zoom: 8,
    center: latLng(-41.20588830649284, 174.91502957335638)
  };

  layersControl = {
    baseLayers: {
      'Open Street Map': tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '...' }),
      'Open Cycle Map': tileLayer('https://{s}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '...' })
    },
    overlays: {
      'Big Circle': circle([ 46.95, -122 ], { radius: 5000 }),
      'Big Square': polygon([[ 46.8, -121.55 ], [ 46.9, -121.55 ], [ 46.9, -121.7 ], [ 46.8, -121.7 ]])
    }
  }

  constructor() { }

  ngOnInit(): void {
    const projection = '+proj=tmerc +lat_0=0.0 +lon_0=173.0 +k=0.9996 +x_0=1600000.0 +y_0=10000000.0 +datum=WGS84 +units=m';

    // Bristol Square
    // -41.20588720282707, 174.9150273021045 (lat, lng)
    // 1760559, 5436631  (lat, lng)

    const prj4 = (proj4 as any).default;
    const forwardResult = prj4(projection).forward([174.9150273021045, -41.20588720282707]);
    //[1760558.522329696, 5436619.128578752] (lat,lng)

    const inverseResult = prj4(projection).inverse([1760559, 5436631]);
    //[174.91502987920867, -41.20578023119023]  (lng, lat)

    console.log(`proj4 forward conversion: `, forwardResult);
    console.log(`proj4 inverse conversion: `, inverseResult);
  }

}
