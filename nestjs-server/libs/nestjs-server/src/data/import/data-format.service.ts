import {Injectable} from "@nestjs/common";
import {DataImportMapping} from "@perfect-stack/nestjs-server/data/import/data-import.types";
import {
    TrackingFlightStatusConverter
} from "@perfect-stack/nestjs-server/data/import/converter/tracking-flight-status.converter";
import {BandNumberLookupConverter} from "@perfect-stack/nestjs-server/data/import/converter/band-number.converter";
import {DateConverter} from "@perfect-stack/nestjs-server/data/import/converter/date.converter";
import {IntegerConverter} from "@perfect-stack/nestjs-server/data/import/converter/integer.converter";
import {TextConverter} from "@perfect-stack/nestjs-server/data/import/converter/text.converter";
import {DuplicateEventCheck} from "@perfect-stack/nestjs-server/data/import/duplicate-event-check";
import {PostImportEventActions} from "@perfect-stack/nestjs-server/data/import/post-import-event-actions";
import {QueryService} from "../query.service";


@Injectable()
export class DataFormatService {

    private _dataFormatMap: Map<string, DataImportMapping>;


    constructor(
        protected readonly queryService: QueryService,
        protected readonly duplicateEventCheck: DuplicateEventCheck,
        protected readonly postImportEventActions: PostImportEventActions,
    ) {}

    isValidDataFormat(dataFormat: string) {
        return this.getDataFormatMap().has(dataFormat);
    }

    getDataFormat(dataFormat: string) {
        return this.getDataFormatMap().get(dataFormat);
    }

    private getDataFormatMap() {
        if(!this._dataFormatMap) {
            this._dataFormatMap = new Map<string, DataImportMapping>();
            this._dataFormatMap.set('Transmitter', this.transmitterFormat);
        }
        return this._dataFormatMap;
    }


    private transmitterFormat: DataImportMapping = {
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
        ]
    }

}