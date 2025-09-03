import { Injectable } from '@nestjs/common';
import * as proj4 from 'proj4';

export class Nztm {
  easting: number;
  northing: number;
  altitude?: number;
}

export class LatLng {
  lat: number;
  lng: number;
  altitude?: number;
}

@Injectable()
export class MapService {
  public static readonly PROJECTION =
    '+proj=tmerc +lat_0=0.0 +lon_0=173.0 +k=0.9996 +x_0=1600000.0 +y_0=10000000.0 +datum=WGS84 +units=m';

  toLatLng(nztm: Nztm): LatLng {
    const prj4 = (proj4 as any).default;
    const inverseResult = proj4(MapService.PROJECTION).inverse([
      nztm.easting,
      nztm.northing,
    ]);
    return {
      lat: inverseResult[1],
      lng: inverseResult[0],
    };
  }

  toNZTM(latLng: LatLng): Nztm {
    const prj4 = (proj4 as any).default;
    const forwardResult = proj4(MapService.PROJECTION).forward([
      latLng.lng,
      latLng.lat,
    ]);
    return {
      easting: forwardResult[0],
      northing: forwardResult[1],
    };
  }
}
