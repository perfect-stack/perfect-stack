import { Injectable, Logger, Optional } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { firstValueFrom } from 'rxjs';
import * as proj4 from 'proj4';
import { Nztm, isWithinNztmBounds } from '../map/map.service';

export interface EsriPoint {
  x?: number;
  y?: number;
  easting?: number;
  northing?: number;
}

export interface EsriElevationResult {
  elevation: number;
  accuracy: number | null;
}

export interface EsriIdentifyResponse {
  objectId?: number;
  name?: string;
  value?: string | number;
  location?: {
    x: number;
    y: number;
    spatialReference?: {
      wkid?: number;
      latestWkid?: number;
    };
  };
  properties?: {
    Values?: string[];
    [key: string]: any;
  };
  catalogItems?: {
    features?: Array<{
      attributes?: Record<string, any>;
    }>;
  };
  catalogItemVisibilities?: number[];
  [key: string]: any;
}

@Injectable()
export class ESRIService {
  private readonly logger = new Logger(ESRIService.name);

  /**
   * PRIMARY: ESRI WorldElevation Dynamic Terrain Service (Global Living Atlas).
   * Provides full-resolution elevation data across New Zealand when queried with an ESRI API key.
   */
  public static readonly ESRI_TERRAIN_URL =
    'https://elevation.arcgis.com/arcgis/rest/services/WorldElevation/Terrain/ImageServer/identify';

  /**
   * FALLBACK / REGIONAL: Eagle Technology New Zealand Elevation Service.
   * NOTE: There are pending support issues with this service. The backend server currently encounters
   * "Failed to open raster dataset" errors when trying to open underlying DEM rasters (e.g. s_nz_8m_dem_2012),
   * causing identify queries to return 'NoData' / 'Missing'. Kept as a fallback once upstream server storage is restored.
   */
  public static readonly NZ_ELEVATION_SERVICE_URL =
    'https://services.arcgisonline.co.nz/arcgis/rest/services/Elevation/New_Zealand_Elevation/ImageServer/identify';

  /**
   * FALLBACK: ESRI WorldElevation3D Terrain3D Tiled Service.
   * Global 3D mesh layer; fallback for coarse overview heights.
   */
  public static readonly ESRI_TERRAIN_3D_URL =
    'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer/identify';

  public static readonly NZTM2000_PROJECTION =
    '+proj=tmerc +lat_0=0.0 +lon_0=173.0 +k=0.9996 +x_0=1600000.0 +y_0=10000000.0 +datum=WGS84 +units=m';

  public static readonly NZTM2000_WKID = 2193;
  public static readonly WGS84_WKID = 4326;
  public static readonly WEB_MERCATOR_WKID = 3857;

  private readonly altitudeCache = new Map<string, number>();
  private readonly elevationCache = new Map<string, EsriElevationResult>();
  private cachedApiKey: string | null = null;

  constructor(
    private readonly httpService: HttpService,
    @Optional() private readonly configService?: ConfigService,
  ) {}

  /**
   * Finds the altitude (in meters) for a given coordinate in NZTM2000 format using ESRI elevation services.
   *
   * @param eastingOrPoint Easting coordinate or object with easting/northing or x/y
   * @param northing Northing coordinate (if first parameter is easting number)
   * @returns Altitude in meters, or null if no data / error
   */
  async getAltitude(
    eastingOrPoint: number | EsriPoint | Nztm,
    northing?: number,
  ): Promise<number | null> {
    let x: number | undefined;
    let y: number | undefined;

    if (typeof eastingOrPoint === 'number') {
      x = eastingOrPoint;
      y = northing;
    } else if (eastingOrPoint && typeof eastingOrPoint === 'object') {
      x =
        'easting' in eastingOrPoint
          ? eastingOrPoint.easting
          : (eastingOrPoint as EsriPoint).x;
      y =
        'northing' in eastingOrPoint
          ? eastingOrPoint.northing
          : (eastingOrPoint as EsriPoint).y;
    }

    if (x === undefined || y === undefined || isNaN(x) || isNaN(y)) {
      this.logger.warn(
        `Invalid coordinates provided for altitude lookup: x=${x}, y=${y}`,
      );
      return null;
    }

    const cacheKey = `${Math.round(x)},${Math.round(y)}`;
    if (this.altitudeCache.has(cacheKey)) {
      return this.altitudeCache.get(cacheKey)!;
    }

    this.logger.log(`Looking up altitude for NZTM coordinate (${x}, ${y})`);

    // 1. Primary: ESRI WorldElevation Terrain ImageServer with API Key
    const esriTerrainAltitude = await this.getAltitudeFromEsriTerrain(x, y);
    if (esriTerrainAltitude !== null) {
      this.altitudeCache.set(cacheKey, esriTerrainAltitude);
      return esriTerrainAltitude;
    }

    // 2. Fallback 1: Eagle Technology NZ Elevation ImageServer (NZTM2000)
    // (Pending upstream support resolution on services.arcgisonline.co.nz)
    const nzAltitude = await this.getAltitudeFromNzElevationService(x, y);
    if (nzAltitude !== null) {
      this.altitudeCache.set(cacheKey, nzAltitude);
      return nzAltitude;
    }

    // 3. Fallback 2: ESRI WorldElevation3D Terrain3D ImageServer (Web Mercator)
    const terrain3dAltitude = await this.getAltitudeFromEsriTerrain3D(x, y);
    if (terrain3dAltitude !== null) {
      this.altitudeCache.set(cacheKey, terrain3dAltitude);
      return terrain3dAltitude;
    }

    return null;
  }

  /**
   * Finds the elevation (in meters) and accuracy estimate (LE90 when < 999, otherwise LowPS)
   * for a given NZTM2000 coordinate using ESRI elevation services.
   */
  async getElevation(
    eastingOrPoint: number | EsriPoint | Nztm,
    northing?: number,
  ): Promise<EsriElevationResult | null> {
    let x: number | undefined;
    let y: number | undefined;

    if (typeof eastingOrPoint === 'number') {
      x = eastingOrPoint;
      y = northing;
    } else if (eastingOrPoint && typeof eastingOrPoint === 'object') {
      x =
        'easting' in eastingOrPoint
          ? eastingOrPoint.easting
          : (eastingOrPoint as EsriPoint).x;
      y =
        'northing' in eastingOrPoint
          ? eastingOrPoint.northing
          : (eastingOrPoint as EsriPoint).y;
    }

    if (x === undefined || y === undefined || isNaN(x) || isNaN(y)) {
      this.logger.warn(
        `Invalid coordinates provided for elevation lookup: x=${x}, y=${y}`,
      );
      return null;
    }

    const cacheKey = `nztm:${Math.round(x)},${Math.round(y)}`;
    if (this.elevationCache.has(cacheKey)) {
      return this.elevationCache.get(cacheKey)!;
    }

    const prj4 = (proj4 as any).default || proj4;
    const [lng, lat] = prj4(ESRIService.NZTM2000_PROJECTION).inverse([x, y]);

    const esriTerrainResult = await this.getElevationFromEsriTerrainWgs84(
      lng,
      lat,
    );
    if (esriTerrainResult !== null) {
      this.elevationCache.set(cacheKey, esriTerrainResult);
      return esriTerrainResult;
    }

    const nzResult = await this.getElevationFromNzElevationService(x, y);
    if (nzResult !== null) {
      this.elevationCache.set(cacheKey, nzResult);
      return nzResult;
    }

    const terrain3dResult = await this.getElevationFromEsriTerrain3DWgs84(
      lng,
      lat,
    );
    if (terrain3dResult !== null) {
      this.elevationCache.set(cacheKey, terrain3dResult);
      return terrain3dResult;
    }

    return null;
  }

  /**
   * Finds the elevation (in meters) and accuracy estimate (LE90 when < 999, otherwise LowPS)
   * for a given WGS84 (longitude, latitude) coordinate using ESRI elevation services.
   */
  async getElevationForWgs84(
    lng: number,
    lat: number,
  ): Promise<EsriElevationResult | null> {
    if (
      !Number.isFinite(lng) ||
      !Number.isFinite(lat) ||
      lng < -180 ||
      lng > 180 ||
      lat < -90 ||
      lat > 90
    ) {
      this.logger.warn(
        `Invalid WGS84 coordinates provided for elevation lookup: lng=${lng}, lat=${lat}`,
      );
      return null;
    }

    const cacheKey = `wgs84:${lng.toFixed(6)},${lat.toFixed(6)}`;
    if (this.elevationCache.has(cacheKey)) {
      return this.elevationCache.get(cacheKey)!;
    }

    this.logger.log(
      `Looking up elevation for WGS84 coordinate (${lng}, ${lat})`,
    );

    const esriTerrainResult = await this.getElevationFromEsriTerrainWgs84(
      lng,
      lat,
    );
    if (esriTerrainResult !== null) {
      this.elevationCache.set(cacheKey, esriTerrainResult);
      return esriTerrainResult;
    }

    if (isWithinNztmBounds(lat, lng)) {
      const prj4 = (proj4 as any).default || proj4;
      const [x, y] = prj4(ESRIService.NZTM2000_PROJECTION).forward([lng, lat]);
      const nzResult = await this.getElevationFromNzElevationService(x, y);
      if (nzResult !== null) {
        this.elevationCache.set(cacheKey, nzResult);
        return nzResult;
      }
    }

    const terrain3dResult = await this.getElevationFromEsriTerrain3DWgs84(
      lng,
      lat,
    );
    if (terrain3dResult !== null) {
      this.elevationCache.set(cacheKey, terrain3dResult);
      return terrain3dResult;
    }

    return null;
  }

  /**
   * PRIMARY ELEVATION QUERY:
   * Queries ESRI WorldElevation Dynamic Terrain ImageServer using WGS84 coordinates and ESRI_API_KEY.
   * Throws an error if ESRI_API_KEY is not configured in ConfigService or AWS Secrets Manager.
   */
  public async getAltitudeFromEsriTerrain(
    x: number,
    y: number,
  ): Promise<number | null> {
    const apiKey = await this.getApiKey();

    try {
      const prj4 = (proj4 as any).default || proj4;
      const [lng, lat] = prj4(ESRIService.NZTM2000_PROJECTION).inverse([x, y]);

      const geometry = JSON.stringify({
        x: lng,
        y: lat,
        spatialReference: { wkid: ESRIService.WGS84_WKID },
      });

      const params: Record<string, any> = {
        geometry,
        geometryType: 'esriGeometryPoint',
        returnGeometry: 'false',
        returnCatalogItems: 'false',
        f: 'json',
        token: apiKey,
      };

      const response = await firstValueFrom(
        this.httpService.get<EsriIdentifyResponse>(
          ESRIService.ESRI_TERRAIN_URL,
          { params },
        ),
      );

      const data = response.data;
      const parsed = this.parseIdentifyResponse(data);
      if (parsed !== null) {
        this.logger.log(
          `Resolved altitude ${parsed}m from ESRI WorldElevation Terrain service for coordinate (${x}, ${y})`,
        );
        return parsed;
      }

      return null;
    } catch (error: any) {
      this.logger.warn(
        `ESRI WorldElevation Terrain lookup failed for coordinate (${x}, ${y}): ${error?.message || error}`,
      );
      return null;
    }
  }

  /**
   * FALLBACK ELEVATION QUERY:
   * Queries Eagle Technology / Living Atlas New Zealand Elevation ImageServer in native NZTM2000 (EPSG:2193).
   * Note: Pending resolution of server-side raster store issues on services.arcgisonline.co.nz.
   */
  public async getAltitudeFromNzElevationService(
    x: number,
    y: number,
  ): Promise<number | null> {
    try {
      const geometry = JSON.stringify({
        x,
        y,
        spatialReference: {
          wkid: ESRIService.NZTM2000_WKID,
        },
      });

      const params = {
        geometry,
        geometryType: 'esriGeometryPoint',
        returnGeometry: 'false',
        returnCatalogItems: 'false',
        f: 'json',
      };

      const response = await firstValueFrom(
        this.httpService.get<EsriIdentifyResponse>(
          ESRIService.NZ_ELEVATION_SERVICE_URL,
          { params },
        ),
      );

      const data = response.data;
      const parsed = this.parseIdentifyResponse(data);
      if (parsed !== null) {
        this.logger.log(
          `Resolved altitude ${parsed}m from NZ Elevation service for coordinate (${x}, ${y})`,
        );
        return parsed;
      }

      return null;
    } catch (error: any) {
      this.logger.warn(
        `NZ Elevation service request failed for coordinate (${x}, ${y}): ${error?.message || error}`,
      );
      return null;
    }
  }

  /**
   * FALLBACK ELEVATION QUERY:
   * Queries ESRI WorldElevation3D Terrain3D service.
   * Converts NZTM2000 to Web Mercator (EPSG:3857) for elevation querying.
   */
  public async getAltitudeFromEsriTerrain3D(
    x: number,
    y: number,
  ): Promise<number | null> {
    try {
      const prj4 = (proj4 as any).default || proj4;
      const [lng, lat] = prj4(ESRIService.NZTM2000_PROJECTION).inverse([x, y]);
      const [mercX, mercY] = prj4('EPSG:4326', 'EPSG:3857', [lng, lat]);

      const geometry = JSON.stringify({
        x: mercX,
        y: mercY,
        spatialReference: { wkid: ESRIService.WEB_MERCATOR_WKID },
      });

      const params = {
        geometry,
        geometryType: 'esriGeometryPoint',
        returnGeometry: 'false',
        returnCatalogItems: 'false',
        f: 'json',
      };

      const response = await firstValueFrom(
        this.httpService.get<EsriIdentifyResponse>(
          ESRIService.ESRI_TERRAIN_3D_URL,
          { params },
        ),
      );

      const data = response.data;
      this.logger.debug(
        `ESRI Terrain3D response for (${x}, ${y}): ${JSON.stringify(data)}`,
      );

      const parsed = this.parseIdentifyResponse(data);
      if (parsed !== null) {
        this.logger.log(
          `Resolved altitude ${parsed}m from ESRI Terrain3D service for coordinate (${x}, ${y})`,
        );
        return parsed;
      }

      return null;
    } catch (error: any) {
      this.logger.warn(
        `ESRI Terrain3D lookup failed for coordinate (${x}, ${y}): ${error?.message || error}`,
      );
      return null;
    }
  }

  public async getElevationFromEsriTerrainWgs84(
    lng: number,
    lat: number,
  ): Promise<EsriElevationResult | null> {
    const apiKey = await this.getApiKey();

    try {
      const geometry = JSON.stringify({
        x: lng,
        y: lat,
        spatialReference: { wkid: ESRIService.WGS84_WKID },
      });

      const params: Record<string, any> = {
        geometry,
        geometryType: 'esriGeometryPoint',
        returnGeometry: 'false',
        returnCatalogItems: 'true',
        f: 'json',
        token: apiKey,
      };

      const response = await firstValueFrom(
        this.httpService.get<EsriIdentifyResponse>(
          ESRIService.ESRI_TERRAIN_URL,
          { params },
        ),
      );

      const data = response.data;
      const elevation = this.parseIdentifyResponse(data);
      if (elevation !== null) {
        const accuracy = this.parseAccuracyFromIdentifyResponse(data);
        this.logger.log(
          `Resolved elevation ${elevation}m (accuracy=${accuracy}m) from ESRI WorldElevation Terrain for (${lng}, ${lat})`,
        );
        return { elevation, accuracy };
      }

      return null;
    } catch (error: any) {
      this.logger.warn(
        `ESRI WorldElevation Terrain lookup failed for coordinate (${lng}, ${lat}): ${error?.message || error}`,
      );
      return null;
    }
  }

  public async getElevationFromNzElevationService(
    x: number,
    y: number,
  ): Promise<EsriElevationResult | null> {
    try {
      const geometry = JSON.stringify({
        x,
        y,
        spatialReference: {
          wkid: ESRIService.NZTM2000_WKID,
        },
      });

      const params = {
        geometry,
        geometryType: 'esriGeometryPoint',
        returnGeometry: 'false',
        returnCatalogItems: 'true',
        f: 'json',
      };

      const response = await firstValueFrom(
        this.httpService.get<EsriIdentifyResponse>(
          ESRIService.NZ_ELEVATION_SERVICE_URL,
          { params },
        ),
      );

      const data = response.data;
      const elevation = this.parseIdentifyResponse(data);
      if (elevation !== null) {
        const accuracy = this.parseAccuracyFromIdentifyResponse(data);
        this.logger.log(
          `Resolved elevation ${elevation}m (accuracy=${accuracy}m) from NZ Elevation service for (${x}, ${y})`,
        );
        return { elevation, accuracy };
      }

      return null;
    } catch (error: any) {
      this.logger.warn(
        `NZ Elevation service request failed for coordinate (${x}, ${y}): ${error?.message || error}`,
      );
      return null;
    }
  }

  public async getElevationFromEsriTerrain3DWgs84(
    lng: number,
    lat: number,
  ): Promise<EsriElevationResult | null> {
    try {
      const prj4 = (proj4 as any).default || proj4;
      const [mercX, mercY] = prj4('EPSG:4326', 'EPSG:3857', [lng, lat]);

      const geometry = JSON.stringify({
        x: mercX,
        y: mercY,
        spatialReference: { wkid: ESRIService.WEB_MERCATOR_WKID },
      });

      const params = {
        geometry,
        geometryType: 'esriGeometryPoint',
        returnGeometry: 'false',
        returnCatalogItems: 'true',
        f: 'json',
      };

      const response = await firstValueFrom(
        this.httpService.get<EsriIdentifyResponse>(
          ESRIService.ESRI_TERRAIN_3D_URL,
          { params },
        ),
      );

      const data = response.data;
      const elevation = this.parseIdentifyResponse(data);
      if (elevation !== null) {
        const accuracy = this.parseAccuracyFromIdentifyResponse(data);
        this.logger.log(
          `Resolved elevation ${elevation}m (accuracy=${accuracy}m) from ESRI Terrain3D service for (${lng}, ${lat})`,
        );
        return { elevation, accuracy };
      }

      return null;
    } catch (error: any) {
      this.logger.warn(
        `ESRI Terrain3D lookup failed for coordinate (${lng}, ${lat}): ${error?.message || error}`,
      );
      return null;
    }
  }

  /**
   * Retrieves the ESRI API Key from ConfigService or AWS Secrets Manager using the service role.
   * If ESRI_API_KEY is not configured directly, performs a secret lookup using ENV_NAME:
   *   secretName = `${ENV_NAME}/capture/esri/api-key`
   * Throws an error if the secret cannot be retrieved or returns null.
   */
  public async getApiKey(): Promise<string> {
    if (this.cachedApiKey) {
      return this.cachedApiKey;
    }

    let apiKey = this.configService?.get<string>('ESRI_API_KEY');

    if (!apiKey) {
      const envName = this.configService?.get<string>('ENV_NAME', null);
      if (envName) {
        const secretName = `${envName}/capture/esri/api-key`;
        try {
          this.logger.log(
            `Fetching ESRI API key from AWS Secrets Manager: ${secretName}`,
          );
          const client = new SecretsManagerClient({});
          const command = new GetSecretValueCommand({
            SecretId: secretName,
          });
          const response = await client.send(command);
          if (response.SecretString) {
            apiKey = response.SecretString;
          }
        } catch (error: any) {
          this.logger.error(
            `Failed to retrieve ESRI API key from AWS Secrets Manager (${secretName}): ${error?.message || error}`,
          );
          throw new Error(
            `Failed to retrieve ESRI API key from AWS Secrets Manager (${secretName}): ${error?.message || error}`,
          );
        }
      }
    }

    if (!apiKey) {
      this.logger.error(
        `No ESRI_API_KEY configured in ConfigService or AWS Secrets Manager; cannot perform WorldElevation Terrain lookup.`,
      );
      throw new Error(
        `No ESRI_API_KEY configured in ConfigService or AWS Secrets Manager; cannot perform WorldElevation Terrain lookup.`,
      );
    }

    this.cachedApiKey = apiKey;
    return apiKey;
  }

  /**
   * Alias for getApiKey()
   */
  public async getAPIKey(): Promise<string> {
    return this.getApiKey();
  }

  /**
   * Helper to parse elevation value from ESRI Identify response.
   */
  private parseIdentifyResponse(data?: EsriIdentifyResponse): number | null {
    if (!data || data.error) return null;

    if (
      data.value !== undefined &&
      data.value !== null &&
      data.value !== 'NoData'
    ) {
      const parsed =
        typeof data.value === 'number' ? data.value : parseFloat(data.value);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }

    if (data.properties?.Values && Array.isArray(data.properties.Values)) {
      for (const val of data.properties.Values) {
        if (val && val !== 'Missing' && val !== 'NoData') {
          const parsed = parseFloat(val);
          if (!isNaN(parsed)) {
            return parsed;
          }
        }
      }
    }

    return null;
  }

  /**
   * Helper to extract accuracy estimate (in meters) from ESRI Identify catalog items.
   * Uses LE90 when valid (< 999), otherwise falls back to LowPS (raster cell resolution), or null if unavailable.
   */
  private parseAccuracyFromIdentifyResponse(
    data?: EsriIdentifyResponse,
  ): number | null {
    const features = data?.catalogItems?.features;
    if (!Array.isArray(features) || features.length === 0) {
      return null;
    }

    let featureIndex = 0;
    if (Array.isArray(data?.catalogItemVisibilities)) {
      const visibleIdx = data.catalogItemVisibilities.findIndex((v) => v > 0);
      if (visibleIdx >= 0 && visibleIdx < features.length) {
        featureIndex = visibleIdx;
      }
    }

    const attrs = features[featureIndex]?.attributes;
    if (!attrs || typeof attrs !== 'object') {
      return null;
    }

    if (attrs.LE90 !== undefined && attrs.LE90 !== null) {
      const le90 = Number(attrs.LE90);
      if (Number.isFinite(le90) && le90 > 0 && le90 < 999) {
        return Math.round(le90 * 100) / 100;
      }
    }

    if (attrs.LowPS !== undefined && attrs.LowPS !== null) {
      const lowPs = Number(attrs.LowPS);
      if (Number.isFinite(lowPs) && lowPs > 0) {
        return Math.round(lowPs * 100) / 100;
      }
    }

    return null;
  }
}

export { ESRIService as EsriService };
