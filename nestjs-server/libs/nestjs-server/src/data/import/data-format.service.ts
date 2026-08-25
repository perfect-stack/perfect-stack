import { Injectable } from "@nestjs/common";
import { DataAttributeMapping, DataImportMapping } from "./data-import.types";
import {
    TrackingFlightStatusConverter
} from "./converter/tracking-flight-status.converter";
import { BandNumberLookupConverter } from "./converter/band-number.converter";
import { DateConverter } from "./converter/date.converter";
import { IntegerConverter } from "./converter/integer.converter";
import { TextConverter } from "./converter/text.converter";
import { DuplicateEventCheck } from "./duplicate-event-check";
import { DuplicateMonitoringStationCheck } from "./duplicate-monitoring-station-check";
import { PostImportEventActions } from "./post-import-event-actions";
import { QueryService } from "../query.service";
import { MicrochipConverter } from "./converter/microchip.converter";
import {
    DualFieldDateTimeConverter
} from "./converter/dual-field-date-time.converter";
import { LocationNameConverter } from "./converter/location-name.converter";
import { DistrictCodeConverter } from "./converter/district-code.converter";



@Injectable()
export class DataFormatService {

    private _dataFormatMap: Map<string, DataImportMapping> | null = null;


    constructor(
        protected readonly queryService: QueryService,
        protected readonly duplicateEventCheck: DuplicateEventCheck,
        protected readonly duplicateMonitoringStationCheck: DuplicateMonitoringStationCheck,
        protected readonly postImportEventActions: PostImportEventActions,
    ) { }

    isValidDataFormat(dataFormat: string) {
        return this.getDataFormatMap().has(dataFormat);
    }

    getDataFormat(dataFormat: string) {
        return this.getDataFormatMap().get(dataFormat);
    }

    private getDataFormatMap() {
        if (!this._dataFormatMap) {
            this._dataFormatMap = new Map<string, DataImportMapping>();
            this._dataFormatMap.set('Place', this.getPlaceFormat());
            this._dataFormatMap.set('Monitoring Station', this.getMonitoringStationFormat());
            this._dataFormatMap.set('Transmitter', this.getTransmitterFormat());
            this._dataFormatMap.set('RFID', this.getRfidFormat());
        }
        return this._dataFormatMap;
    }

    private getPlaceFormat(): DataImportMapping {
        return {
            metaEntityName: 'Place',
            duplicateCheck: null,
            postImportActions: null,
            attributeMappings: [
                {
                    columnName: 'Line Name',
                    attributeName: 'place_title',
                    indicatesBlankRow: true,
                    converter: new TextConverter(),
                    defaultValue: []
                },
                {
                    columnName: 'Line',
                    attributeName: 'district_code',
                    converter: new DistrictCodeConverter(this.queryService)
                },
                {
                    attributeName: 'tier',
                    defaultValue: 3
                },
                {
                    columnName: 'Set',
                    attributeName: 'set',
                    converter: new TextConverter()
                },
                {
                    attributeName: 'set_group',
                    defaultValue: 'TODO'
                },
                {
                    columnName: 'Site',
                    attributeName: 'site',
                    converter: new TextConverter()
                },
            ].map(mapping => Object.assign(new DataAttributeMapping(), mapping))
        };
    }

    private getMonitoringStationFormat(): DataImportMapping {
        return {
            metaEntityName: 'MonitoringStation',
            duplicateCheck: this.duplicateMonitoringStationCheck,
            postImportActions: null,
            attributeMappings: [
                {
                    columnName: 'Station Name',
                    attributeName: 'station_title',
                    indicatesBlankRow: true,
                    converter: new TextConverter(),
                    defaultValue: []
                },
                {
                    columnName: 'Easting',
                    attributeName: 'easting',
                    converter: new IntegerConverter()
                },
                {
                    columnName: 'Northing',
                    attributeName: 'northing',
                    converter: new IntegerConverter()
                },
            ].map(mapping => Object.assign(new DataAttributeMapping(), mapping))
        };
    }

    private getTransmitterFormat(): DataImportMapping {
        return {
            metaEntityName: 'Event',
            duplicateCheck: this.duplicateEventCheck,
            postImportActions: this.postImportEventActions,
            attributeMappings: [
                {
                    attributeName: 'event_type',
                    defaultValue: 'Transmitter'
                },
                {
                    attributeName: 'data_source',
                    defaultValue: 'KIMS'
                },
                {
                    attributeName: 'activities',
                    defaultValue: []
                },
                {
                    attributeName: 'observers',
                    defaultValue: []
                },
                {
                    attributeName: 'instruments',
                    defaultValue: []
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
                    converter: new DateConverter()
                },
                {
                    columnName: 'Date',
                    attributeName: 'end_date_time',
                    indicatesBlankRow: true,
                    converter: new DateConverter()
                },
                {
                    columnName: 'Easting NZTM',
                    attributeName: 'easting',
                    indicatesBlankRow: true,
                    converter: new IntegerConverter()
                },
                {
                    columnName: 'Northing NZTM',
                    attributeName: 'northing',
                    indicatesBlankRow: true,
                    converter: new IntegerConverter()
                },
                {
                    columnName: 'Comments',
                    attributeName: 'comments',
                    indicatesBlankRow: true,
                    converter: new TextConverter()
                },
            ].map(mapping => Object.assign(new DataAttributeMapping(), mapping))
        };
    }


    private getRfidFormat(): DataImportMapping {
        return {
            metaEntityName: 'Event',
            duplicateCheck: this.duplicateEventCheck,
            postImportActions: null,
            attributeMappings: [
                {
                    attributeName: 'event_type',
                    defaultValue: 'Electronic'
                },
                {
                    attributeName: 'data_source',
                    defaultValue: 'KIMS'
                },
                {
                    attributeName: 'activities',
                    defaultValue: []
                },
                {
                    attributeName: 'observers',
                    defaultValue: []
                },
                {
                    attributeName: 'instruments',
                    defaultValue: []
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
                    converter: new DualFieldDateTimeConverter()
                },
                {
                    columnName: ['date', 'time'],
                    attributeName: 'end_date_time',
                    indicatesBlankRow: false,
                    converter: new DualFieldDateTimeConverter()
                },
                {
                    columnName: 'microchip',
                    indicatesBlankRow: true,
                    converter: new MicrochipConverter(this.queryService),
                },
            ].map(mapping => Object.assign(new DataAttributeMapping(), mapping))
        };
    }
}