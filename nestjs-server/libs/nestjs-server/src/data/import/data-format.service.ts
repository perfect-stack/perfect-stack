import { Injectable } from '@nestjs/common';
import { DataAttributeMapping, DataImportClientMapping, DataImportMapping } from './data-import.types';
import { TrackingFlightStatusConverter } from './converter/tracking-flight-status.converter';
import { BandNumberLookupConverter } from './converter/band-number.converter';
import { DateConverter } from './converter/date.converter';
import { IntegerConverter } from './converter/integer.converter';
import { NZTMCoordinateConverter } from './converter/nztm-coordinate.converter';
import { TextConverter } from './converter/text.converter';
import { DuplicateEventCheck } from './duplicate-event-check';
import { DuplicateMonitoringStationCheck } from './duplicate-monitoring-station-check';
import { DuplicatePlaceCheck } from './duplicate-place-check';
import { PostImportEventActions } from './post-import-event-actions';
import { QueryService } from '../query.service';
import { MicrochipConverter } from './converter/microchip.converter';
import { DualFieldDateTimeConverter } from './converter/dual-field-date-time.converter';
import { LocationNameConverter } from './converter/location-name.converter';
import { DistrictCodeConverter } from './converter/district-code.converter';
import { PlaceLookupConverter } from './converter/place-lookup.converter';
import { AltitudeConverter } from './converter/altitude.converter';
import { ESRIService } from '../../esri/esri.service';

@Injectable()
export class DataFormatService {
  private _dataFormatMap: Map<string, DataImportMapping> | null = null;

  constructor(
    protected readonly queryService: QueryService,
    protected readonly duplicateEventCheck: DuplicateEventCheck,
    protected readonly duplicateMonitoringStationCheck: DuplicateMonitoringStationCheck,
    protected readonly duplicatePlaceCheck: DuplicatePlaceCheck,
    protected readonly postImportEventActions: PostImportEventActions,
    protected readonly esriService: ESRIService,
  ) {}

  isValidDataFormat(dataFormat: string) {
    return this.getDataFormatMap().has(dataFormat);
  }

  getDataFormat(dataFormat: string) {
    return this.getDataFormatMap().get(dataFormat);
  }

  getDataImportClientMapping(): DataImportClientMapping[] {
    return Array.from(this.getDataFormatMap().values())
      .map((format) => ({
        title: format.title,
        metaEntityName: format.metaEntityName,
      }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  private getDataFormatMap() {
    if (!this._dataFormatMap) {
      const formats: DataImportMapping[] = [
        this.getPlaceFormat(),
        this.getMonitoringStationFormat(),
        this.getTransmitterFormat(),
        this.getRfidFormat(),
      ];
      this._dataFormatMap = new Map<string, DataImportMapping>(
        formats.map((format) => [format.title, format]),
      );
    }
    return this._dataFormatMap;
  }

  private getPlaceFormat(): DataImportMapping {
    return {
      title: 'Place',
      metaEntityName: 'Place',
      duplicateCheck: this.duplicatePlaceCheck,
      postImportActions: null,
      attributeMappings: [
        {
          columnName: 'Line Name',
          attributeName: 'place_title',
          indicatesBlankRow: true,
          converter: new TextConverter(),
          defaultValue: [],
        },
        {
          columnName: ['District Code', 'Existing Line'],
          attributeName: 'district_code',
          converter: new DistrictCodeConverter(this.queryService),
        },
        {
          attributeName: 'tier',
          defaultValue: 3,
        },
        {
          columnName: 'Set',
          attributeName: 'set',
          converter: new TextConverter(),
        },
        {
          attributeName: 'set_group',
          defaultValue: 'TODO',
        },
        {
          columnName: 'Site',
          attributeName: 'site',
          converter: new TextConverter(),
        },
        {
          attributeName: 'status',
          defaultValue: 'CARMON',
        },
      ].map((mapping) => Object.assign(new DataAttributeMapping(), mapping)),
    };
  }

  private getMonitoringStationFormat(): DataImportMapping {
    return {
      title: 'Monitoring Station',
      metaEntityName: 'MonitoringStation',
      duplicateCheck: this.duplicateMonitoringStationCheck,
      postImportActions: null,
      attributeMappings: [
        {
          columnName: 'Station Name',
          attributeName: 'station_title',
          indicatesBlankRow: true,
          converter: new TextConverter(),
          defaultValue: [],
        },
        {
          columnName: 'Line Name',
          attributeName: 'place_id',
          converter: new PlaceLookupConverter(this.queryService),
        },
        {
          columnName: 'Easting',
          attributeName: 'easting',
          converter: new NZTMCoordinateConverter(),
        },
        {
          columnName: 'Northing',
          attributeName: 'northing',
          converter: new NZTMCoordinateConverter(),
        },
        {
          columnName: ['Easting', 'Northing'],
          attributeName: 'altitude',
          converter: new AltitudeConverter(this.esriService),
        },
        {
          attributeName: 'status',
          defaultValue: 'Review Accepted',
        },
        {
          attributeName: 'station_type',
          defaultValue: 'CAR',
        },
      ].map((mapping) => Object.assign(new DataAttributeMapping(), mapping)),
    };
  }

  private getTransmitterFormat(): DataImportMapping {
    return {
      title: 'Transmitter',
      metaEntityName: 'Event',
      duplicateCheck: this.duplicateEventCheck,
      postImportActions: this.postImportEventActions,
      attributeMappings: [
        {
          attributeName: 'event_type',
          defaultValue: 'Transmitter',
        },
        {
          attributeName: 'data_source',
          defaultValue: 'KIMS',
        },
        {
          attributeName: 'activities',
          defaultValue: [],
        },
        {
          attributeName: 'observers',
          defaultValue: [],
        },
        {
          attributeName: 'instruments',
          defaultValue: [],
        },
        {
          columnName: 'V band',
          indicatesBlankRow: false,
          converter: new BandNumberLookupConverter(this.queryService),
        },
        {
          // Important: this converter must be processed after the BandNumberLookupConverter
          columnName: 'Status',
          attributeName: 'status',
          indicatesBlankRow: true,
          converter: new TrackingFlightStatusConverter(),
        },
        {
          columnName: 'Date',
          attributeName: 'date_time',
          indicatesBlankRow: true,
          converter: new DateConverter(),
        },
        {
          columnName: 'Date',
          attributeName: 'end_date_time',
          indicatesBlankRow: true,
          converter: new DateConverter(),
        },
        {
          columnName: 'Easting NZTM',
          attributeName: 'easting',
          indicatesBlankRow: true,
          converter: new IntegerConverter(),
        },
        {
          columnName: 'Northing NZTM',
          attributeName: 'northing',
          indicatesBlankRow: true,
          converter: new IntegerConverter(),
        },
        {
          columnName: 'Comments',
          attributeName: 'comments',
          indicatesBlankRow: true,
          converter: new TextConverter(),
        },
      ].map((mapping) => Object.assign(new DataAttributeMapping(), mapping)),
    };
  }

  private getRfidFormat(): DataImportMapping {
    return {
      title: 'RFID',
      metaEntityName: 'Event',
      duplicateCheck: this.duplicateEventCheck,
      postImportActions: null,
      attributeMappings: [
        {
          attributeName: 'event_type',
          defaultValue: 'Electronic',
        },
        {
          attributeName: 'data_source',
          defaultValue: 'KIMS',
        },
        {
          attributeName: 'activities',
          defaultValue: [],
        },
        {
          attributeName: 'observers',
          defaultValue: [],
        },
        {
          attributeName: 'instruments',
          defaultValue: [],
        },
        {
          columnName: 'site_name',
          indicatesBlankRow: false,
          converter: new LocationNameConverter(this.queryService),
        },
        {
          columnName: ['date', 'time'],
          attributeName: 'date_time',
          indicatesBlankRow: false,
          converter: new DualFieldDateTimeConverter(),
        },
        {
          columnName: ['date', 'time'],
          attributeName: 'end_date_time',
          indicatesBlankRow: false,
          converter: new DualFieldDateTimeConverter(),
        },
        {
          columnName: 'microchip',
          indicatesBlankRow: true,
          converter: new MicrochipConverter(this.queryService),
        },
      ].map((mapping) => Object.assign(new DataAttributeMapping(), mapping)),
    };
  }
}
