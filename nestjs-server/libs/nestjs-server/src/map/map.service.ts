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

export interface GeoJsonPoint {
  type: 'Point';
  coordinates: [number, number];
}

export const EARTH_RADIUS_METERS = 6371008.8;

export function parseGeoJsonGeometry(value: any): any | null {
  if (!value) {
    return null;
  }
  let parsed = value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== 'object') {
    return null;
  }
  if (parsed.type === 'Feature') {
    return parsed.geometry && typeof parsed.geometry === 'object'
      ? parsed.geometry
      : null;
  }
  return parsed.type ? parsed : null;
}

/**
 * Checks whether a WGS84 lat/lng lies within the official NZTM2000 coverage envelope
 * (covers New Zealand mainland, Stewart Island, Kermadecs, Subantarctic islands, and Chathams).
 */
export function isWithinNztmBounds(lat: number, lng: number): boolean {
  if (
    typeof lat !== 'number' ||
    typeof lng !== 'number' ||
    !isFinite(lat) ||
    !isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return false;
  }
  if (lat < -58.0 || lat > -24.0) {
    return false;
  }
  return (lng >= 160.0 && lng <= 180.0) || (lng >= -180.0 && lng <= -170.0);
}

/**
 * Calculates Great Circle distance between two WGS84 [lng, lat] coordinates in meters.
 */
export function haversineDistanceMeters(
  p1: [number, number] | number[],
  p2: [number, number] | number[],
): number {
  if (!p1 || !p2 || p1.length < 2 || p2.length < 2) {
    return 0;
  }
  const [lng1, lat1] = p1;
  const [lng2, lat2] = p2;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) *
      Math.cos(lat2 * rad) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

function interpolateGreatCircle(
  p1: [number, number],
  p2: [number, number],
  fraction: number,
): [number, number] {
  const t = Math.max(0, Math.min(1, fraction));
  if (t === 0) return [p1[0], p1[1]];
  if (t === 1) return [p2[0], p2[1]];

  const rad = Math.PI / 180;
  const deg = 180 / Math.PI;
  const lon1 = p1[0] * rad;
  const lat1 = p1[1] * rad;
  const lon2 = p2[0] * rad;
  const lat2 = p2[1] * rad;

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const delta = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  if (delta < 1e-9) {
    return [
      p1[0] + t * (p2[0] - p1[0]),
      p1[1] + t * (p2[1] - p1[1]),
    ];
  }

  const sinDelta = Math.sin(delta);
  const weightA = Math.sin((1 - t) * delta) / sinDelta;
  const weightB = Math.sin(t * delta) / sinDelta;

  const x =
    weightA * Math.cos(lat1) * Math.cos(lon1) +
    weightB * Math.cos(lat2) * Math.cos(lon2);
  const y =
    weightA * Math.cos(lat1) * Math.sin(lon1) +
    weightB * Math.cos(lat2) * Math.sin(lon2);
  const z = weightA * Math.sin(lat1) + weightB * Math.sin(lat2);

  const latMid = Math.atan2(z, Math.sqrt(x * x + y * y)) * deg;
  const lonMid = Math.atan2(y, x) * deg;
  return [lonMid, latMid];
}

/**
 * Calculates the point at 50% of the total Great Circle path length along a LineString,
 * guaranteeing the midpoint lies on the line even for curved routes.
 */
export function calculateLineMidpoint(
  coordinates: number[][],
): GeoJsonPoint | null {
  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    return null;
  }

  const validCoords: [number, number][] = [];
  for (const pt of coordinates) {
    if (
      Array.isArray(pt) &&
      pt.length >= 2 &&
      typeof pt[0] === 'number' &&
      typeof pt[1] === 'number' &&
      isFinite(pt[0]) &&
      isFinite(pt[1])
    ) {
      validCoords.push([pt[0], pt[1]]);
    }
  }

  if (validCoords.length === 0) {
    return null;
  }
  if (validCoords.length === 1) {
    return {
      type: 'Point',
      coordinates: [
        Number(validCoords[0][0].toFixed(7)),
        Number(validCoords[0][1].toFixed(7)),
      ],
    };
  }

  const segLengths: number[] = [];
  let totalLength = 0;
  for (let i = 0; i < validCoords.length - 1; i++) {
    const len = haversineDistanceMeters(validCoords[i], validCoords[i + 1]);
    segLengths.push(len);
    totalLength += len;
  }

  if (totalLength === 0) {
    return {
      type: 'Point',
      coordinates: [
        Number(validCoords[0][0].toFixed(7)),
        Number(validCoords[0][1].toFixed(7)),
      ],
    };
  }

  const target = totalLength / 2;
  let accumulated = 0;
  for (let i = 0; i < segLengths.length; i++) {
    const len = segLengths[i];
    if (accumulated + len >= target && len > 0) {
      const t = (target - accumulated) / len;
      const [lng, lat] = interpolateGreatCircle(
        validCoords[i],
        validCoords[i + 1],
        t,
      );
      return {
        type: 'Point',
        coordinates: [Number(lng.toFixed(7)), Number(lat.toFixed(7))],
      };
    }
    accumulated += len;
  }

  const last = validCoords[validCoords.length - 1];
  return {
    type: 'Point',
    coordinates: [Number(last[0].toFixed(7)), Number(last[1].toFixed(7))],
  };
}

export function isGeometryPolygon(geo: any): boolean {
  const parsed = parseGeoJsonGeometry(geo);
  return (
    parsed !== null &&
    (parsed.type === 'Polygon' || parsed.type === 'MultiPolygon')
  );
}

export function isValidGeoJsonPoint(geo: any): boolean {
  const parsed = parseGeoJsonGeometry(geo);
  if (
    !parsed ||
    parsed.type !== 'Point' ||
    !Array.isArray(parsed.coordinates) ||
    parsed.coordinates.length < 2
  ) {
    return false;
  }
  const [lng, lat] = parsed.coordinates;
  return (
    typeof lng === 'number' &&
    typeof lat === 'number' &&
    isFinite(lng) &&
    isFinite(lat) &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90
  );
}

@Injectable()
export class MapService {
  public static readonly PROJECTION =
    '+proj=tmerc +lat_0=0.0 +lon_0=173.0 +k=0.9996 +x_0=1600000.0 +y_0=10000000.0 +datum=WGS84 +units=m';

  toLatLng(nztm: Nztm): LatLng {
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
    const forwardResult = proj4(MapService.PROJECTION).forward([
      latLng.lng,
      latLng.lat,
    ]);
    return {
      easting: forwardResult[0],
      northing: forwardResult[1],
    };
  }

  isWithinNztmBounds(lat: number, lng: number): boolean {
    return isWithinNztmBounds(lat, lng);
  }

  calculateLineMidpoint(coordinates: number[][]): GeoJsonPoint | null {
    return calculateLineMidpoint(coordinates);
  }

  isGeometryPolygon(geo: any): boolean {
    return isGeometryPolygon(geo);
  }

  isValidGeoJsonPoint(geo: any): boolean {
    return isValidGeoJsonPoint(geo);
  }
}
