import * as proj4Import from 'proj4';
import {
  ConverterResult,
  DataListImportConverter,
  ExternalValue,
} from './converter.types';
import { QueryService } from '../../query.service';
import { AttributeType, ComparisonOperator } from '../../../domain/meta.entity';
import { Criteria, QueryRequest } from '../../query.request';

const proj4 = (proj4Import as any).default || proj4Import;

// Ensure standard NZ coordinate reference systems are registered in proj4
const NZTM_DEF =
  '+proj=tmerc +lat_0=0 +lon_0=173 +k=0.9996 +x_0=1600000 +y_0=10000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
const NZMG_DEF =
  '+proj=nzmg +lat_0=-41 +lon_0=173 +x_0=2510000 +y_0=6023150 +ellps=intl +towgs84=59.47,-5.04,188.3,-0.47,-0.1,1.024,-4.59 +units=m +no_defs';

try {
  proj4.defs('EPSG:2193', NZTM_DEF);
  proj4.defs('EPSG:27200', NZMG_DEF);
  proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs');
} catch (e) {
  // Ignore if already registered
}

export class LocationConverter implements DataListImportConverter {
  constructor(protected readonly queryService?: QueryService) {}

  async toAttributeValueFromExternalValueList(
    attributeName: string,
    externalValueList: ExternalValue[],
  ): Promise<ConverterResult> {
    const normalize = (s: string) => (s ? s.toLowerCase().replace(/[\s_\-]+/g, '') : '');

    const findItem = (names: string[]) => {
      const normNames = names.map(normalize);
      return externalValueList.find(
        (e) =>
          names.includes(e.name) ||
          names.some((n) => n.toLowerCase() === e.name?.toLowerCase()) ||
          normNames.includes(normalize(e.name)),
      );
    };

    const eastingItem = findItem([
      'Easting',
      'easting',
      'East',
      'east',
      'E',
      'e',
      'X',
      'x',
      'Grid East',
      'NZTM Easting',
      'NZTM_E',
      'NZTM_Easting',
    ]);
    const northingItem = findItem([
      'Northing',
      'northing',
      'North',
      'north',
      'N',
      'n',
      'Y',
      'y',
      'Grid North',
      'NZTM Northing',
      'NZTM_N',
      'NZTM_Northing',
    ]);
    const lngItem = findItem(['Longitude', 'longitude', 'Long', 'long', 'Lng', 'lng']);
    const latItem = findItem(['Latitude', 'latitude', 'Lat', 'lat']);
    const srsItem = findItem(['SRS', 'srs', 'Coord System', 'coord_system', 'CRS', 'crs']);
    const stationItem = findItem([
      'Station Name',
      'station name',
      'Station',
      'station',
      'Site Name',
      'site name',
      'Location Name',
      'location name',
      'Line Name',
      'line name',
      'location',
    ]);

    const isPresent = (v: any) => v !== null && v !== undefined && String(v).trim() !== '';

    const eastingRaw = eastingItem?.value;
    const northingRaw = northingItem?.value;
    const lngRaw = lngItem?.value;
    const latRaw = latItem?.value;
    const srsRaw = srsItem?.value;
    const stationRaw = stationItem?.value ? String(stationItem.value).trim() : null;

    const hasEasting = isPresent(eastingRaw);
    const hasNorthing = isPresent(northingRaw);
    const hasLng = isPresent(lngRaw);
    const hasLat = isPresent(latRaw);

    // If one of easting/northing is present without the other
    if (hasEasting !== hasNorthing) {
      return {
        attributeValues: [
          {
            name: attributeName,
            value: null,
            error: 'Both easting and northing must be provided',
          },
        ],
      };
    }

    // If one of lng/lat is present without the other
    if (hasLng !== hasLat) {
      return {
        attributeValues: [
          {
            name: attributeName,
            value: null,
            error: 'Both longitude and latitude must be provided',
          },
        ],
      };
    }

    // If no coordinates provided at all
    if (!hasEasting && !hasLng) {
      // Fallback: if station name provided and queryService available, try to look up existing Location
      if (stationRaw && this.queryService) {
        try {
          const queryRequest = new QueryRequest();
          queryRequest.metaEntityName = 'Location';
          queryRequest.criteria = [
            {
              attributeType: AttributeType.Text,
              operator: ComparisonOperator.InsensitiveStartsWith,
              name: 'location_notes',
              value: stationRaw,
            },
          ];
          const queryResponse = await this.queryService.findByCriteria(queryRequest);
          if (queryResponse && queryResponse.totalCount === 1) {
            return {
              attributeValues: [
                {
                  name: attributeName,
                  value: { id: queryResponse.resultList[0].id },
                },
              ],
            };
          }
        } catch (e) {
          // Fall through to null
        }
      }

      return {
        attributeValues: [
          {
            name: attributeName,
            value: null,
          },
        ],
      };
    }

    let easting: number | null = null;
    let northing: number | null = null;
    let lng: number | null = null;
    let lat: number | null = null;
    let srs = srsRaw ? String(srsRaw).trim() : 'EPSG:2193';

    if (hasEasting && hasNorthing) {
      const cleanE = String(eastingRaw).replace(/,/g, '').trim();
      const cleanN = String(northingRaw).replace(/,/g, '').trim();
      easting = parseFloat(cleanE);
      northing = parseFloat(cleanN);

      if (isNaN(easting) || isNaN(northing)) {
        return {
          attributeValues: [
            {
              name: attributeName,
              value: null,
              error: `Invalid coordinates: easting '${eastingRaw}', northing '${northingRaw}'`,
            },
          ],
        };
      }

      // Check if coordinates were entered as WGS84 lat/long into easting/northing columns
      if (Math.abs(easting) <= 180 && Math.abs(northing) <= 90) {
        // [longitude, latitude] in easting, northing
        lng = easting;
        lat = northing;
        srs = 'EPSG:4326';
      } else if (Math.abs(northing) <= 180 && Math.abs(easting) <= 90) {
        // Inverted: [latitude, longitude] in easting, northing
        lat = easting;
        lng = northing;
        srs = 'EPSG:4326';
      } else if (
        (srs.includes('27200') || srs.toUpperCase().includes('NZMG')) ||
        (easting >= 2100000 && easting <= 3100000 && northing >= 5000000 && northing <= 7000000)
      ) {
        // NZMG (EPSG:27200)
        srs = 'EPSG:27200';
        try {
          const [wgsLng, wgsLat] = proj4('EPSG:27200', 'EPSG:4326', [easting, northing]);
          lng = wgsLng;
          lat = wgsLat;
        } catch (err: any) {
          return {
            attributeValues: [
              {
                name: attributeName,
                value: null,
                error: `NZMG coordinate projection error: ${err.message || String(err)}`,
              },
            ],
          };
        }
      } else {
        // Standard NZTM2000 (EPSG:2193)
        srs = 'EPSG:2193';
        try {
          const [wgsLng, wgsLat] = proj4('EPSG:2193', 'EPSG:4326', [easting, northing]);
          lng = wgsLng;
          lat = wgsLat;
        } catch (err: any) {
          return {
            attributeValues: [
              {
                name: attributeName,
                value: null,
                error: `NZTM coordinate projection error: ${err.message || String(err)}`,
              },
            ],
          };
        }
      }
    } else if (hasLng && hasLat) {
      const cleanLng = String(lngRaw).replace(/,/g, '').trim();
      const cleanLat = String(latRaw).replace(/,/g, '').trim();
      lng = parseFloat(cleanLng);
      lat = parseFloat(cleanLat);

      if (isNaN(lng) || isNaN(lat)) {
        return {
          attributeValues: [
            {
              name: attributeName,
              value: null,
              error: `Invalid coordinates: longitude '${lngRaw}', latitude '${latRaw}'`,
            },
          ],
        };
      }

      srs = 'EPSG:4326';
    }

    if (lng === null || lat === null) {
      return {
        attributeValues: [
          {
            name: attributeName,
            value: null,
            error: 'Unable to derive coordinates',
          },
        ],
      };
    }

    // Validate WGS84 range
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return {
        attributeValues: [
          {
            name: attributeName,
            value: null,
            error: `Derived coordinates are outside valid WGS84 boundaries: [${lng}, ${lat}]`,
          },
        ],
      };
    }

    const pointGeometry = {
      type: 'Point',
      coordinates: [Number(lng.toFixed(7)), Number(lat.toFixed(7))],
    };

    const locationEntity: any = {
      id: null,
      geometry: pointGeometry,
      centerpoint: pointGeometry,
      srs_or_coord_system: srs,
      location_notes: stationRaw || null,
    };

    return {
      attributeValues: [
        {
          name: attributeName,
          value: locationEntity,
        },
      ],
    };
  }
}
