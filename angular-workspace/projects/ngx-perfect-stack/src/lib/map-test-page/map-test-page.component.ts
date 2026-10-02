import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import TileLayer from '@arcgis/core/layers/TileLayer';
import Point from '@arcgis/core/geometry/Point';
import * as proj4 from 'proj4';

@Component({
  selector: 'lib-map-test-page',
  templateUrl: './map-test-page.component.html',
  styleUrls: ['./map-test-page.component.css'],
  standalone: false
})
export class MapTestPageComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('mapViewNode', { static: false }) mapViewNode!: ElementRef<HTMLDivElement>;
  private mapView?: MapView;

  constructor() { }

  ngOnInit(): void {
    const projection = '+proj=tmerc +lat_0=0.0 +lon_0=173.0 +k=0.9996 +x_0=1600000.0 +y_0=10000000.0 +datum=WGS84 +units=m';
    const prj4 = (proj4 as any).default;
    const forwardResult = prj4(projection).forward([174.9150273021045, -41.20588720282707]);
    const inverseResult = prj4(projection).inverse([1760559, 5436631]);

    console.log(`proj4 forward conversion: `, forwardResult);
    console.log(`proj4 inverse conversion: `, inverseResult);
  }

  ngAfterViewInit(): void {
    if (this.mapViewNode?.nativeElement) {
      const topoLayer = new TileLayer({
        url: 'https://services1.arcgisonline.co.nz/arcgis/rest/services/LINZ/geotiffs/MapServer'
      });
      const map = new Map({
        layers: [topoLayer]
      });
      this.mapView = new MapView({
        container: this.mapViewNode.nativeElement,
        map: map,
        center: new Point({ x: 1760559, y: 5436619, spatialReference: { wkid: 2193 } }),
        zoom: 8
      });
    }
  }

  ngOnDestroy(): void {
    if (this.mapView) {
      this.mapView.destroy();
    }
  }
}
