import { Injectable } from '@angular/core';
import {latLng, LatLng} from 'leaflet';
import * as proj4 from 'proj4';

export class Nztm {
  easting: number;
  northing: number;
  altitude?: number;
}

@Injectable({
  providedIn: 'root'
})
export class MapService {

  constructor() { }

  toLatLng(nztm: Nztm): LatLng {
    const prj4 = (proj4 as any).default;
    const projection = '+proj=tmerc +lat_0=0.0 +lon_0=173.0 +k=0.9996 +x_0=1600000.0 +y_0=10000000.0 +datum=WGS84 +units=m';
    const result = prj4(projection).inverse([nztm.easting, nztm.northing]);

    return latLng(result[1], result[0]);
  }

  toNZTM(latLng: LatLng): Nztm {
    const prj4 = (proj4 as any).default;
    const projection = '+proj=tmerc +lat_0=0.0 +lon_0=173.0 +k=0.9996 +x_0=1600000.0 +y_0=10000000.0 +datum=WGS84 +units=m';
    const forwardResult = prj4(projection).forward([latLng.lng, latLng.lat]);
    return {
      easting: forwardResult[0],
      northing: forwardResult[1]
    }
  }
}
