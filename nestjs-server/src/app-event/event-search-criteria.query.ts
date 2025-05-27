import { Injectable, Logger } from '@nestjs/common';
import { CustomQuery } from '../data/custom-query.service';
import { KnexService } from '../knex/knex.service';
import { MetaEntityService } from '../meta/meta-entity/meta-entity.service';
import { QueryRequest } from '../data/query.request';
import { QueryResponse } from '../data/query.response';
import {
  getCriteriaValue,
  KnexComparisonOperatorMap,
} from '../data/query-utils';
import {DiscriminatorService} from "../data/discriminator.service";

@Injectable()
export class EventSearchCriteriaQuery implements CustomQuery {
  private readonly logger = new Logger(EventSearchCriteriaQuery.name);

  constructor(
    protected readonly knexService: KnexService,
    protected readonly metaEntityService: MetaEntityService,
    protected readonly discriminatorService: DiscriminatorService
  ) {}

  async findByCriteria(
    queryRequest: QueryRequest,
  ): Promise<QueryResponse<any>> {
    let pageNumber = queryRequest.pageNumber;
    let pageSize = queryRequest.pageSize;

    if (!pageNumber) {
      pageNumber = 1;
    }

    if (!pageSize) {
      pageSize = 50;
    }
    const offset = (pageNumber - 1) * pageSize;

    //const metaEntity = await this.metaEntityService.findOne('Event');
    //const activitiesAttribute = metaEntity.attributes['activities'];
    //const discriminatorMap = await this.discriminatorService.findDiscriminatorMap(activitiesAttribute);

    const activityTypeMap = new Map<string, string>();
    activityTypeMap.set('Banding', 'at_baa');
    activityTypeMap.set('Call count', 'at_cal');
    activityTypeMap.set('Capture', 'at_cap');
    activityTypeMap.set('Death', 'at_dea');
    activityTypeMap.set('Health', 'at_hea');
    activityTypeMap.set('Measurement', 'at_mea');
    activityTypeMap.set('Microchip', 'at_mia');
    activityTypeMap.set('Nesting', 'at_nes');
    activityTypeMap.set('Sample', 'at_sam');
    activityTypeMap.set('Weather', 'at_wea');
    activityTypeMap.set('Weight', 'at_wei');
    activityTypeMap.set('Wing tag', 'at_win');


    // Get the values (the short codes) from the map
    const shortCodes = Array.from(activityTypeMap.values());

    // Construct the concat string
    const concatString = shortCodes.map(code => `${code}.name`).join(", ',', ");

    // Add the prefix and suffix
    const activityNames = `concat(${concatString}) as activities`;

    const knex = await this.knexService.getKnex();
    const selectData = () =>
      knex.select(
        'Event.id',
        'Event.date_time',
        'Bird.name as bird',
        'Bird.band_number as band_number',
        'Species.name as species',
        'Event.form as form',
        'Event.event_type as event_type',
        knex.raw(activityNames),
      );

    const selectCount = () => knex.select().count();

    const from = (select) => {
      select = select
        .from('Event')
        .leftOuterJoin('Bird', 'Bird.id', 'Event.bird_id')
        .leftOuterJoin('Species', 'Species.id', 'Event.species_id')

        .leftOuterJoin('BandingActivity as baa', 'baa.event_id', 'Event.id')
        .leftOuterJoin('ActivityType as at_baa', 'at_baa.id', 'baa.activity_type_id')

        .leftOuterJoin('CallCountActivity as cal', 'cal.event_id', 'Event.id')
        .leftOuterJoin('ActivityType as at_cal', 'at_cal.id', 'cal.activity_type_id')

        .leftOuterJoin('CaptureActivity as cap', 'cap.event_id', 'Event.id')
        .leftOuterJoin('ActivityType as at_cap', 'at_cap.id', 'cap.activity_type_id')

        .leftOuterJoin('DeathActivity as dea', 'dea.event_id', 'Event.id')
        .leftOuterJoin('ActivityType as at_dea', 'at_dea.id', 'dea.activity_type_id')

        .leftOuterJoin('HealthActivity as hea', 'hea.event_id', 'Event.id')
        .leftOuterJoin('ActivityType as at_hea', 'at_hea.id', 'hea.activity_type_id')

        .leftOuterJoin('MeasurementActivity as mea', 'mea.event_id', 'Event.id')
        .leftOuterJoin('ActivityType as     at_mea', 'at_mea.id', 'mea.activity_type_id')

        .leftOuterJoin('MicrochipActivity as mia', 'mia.event_id', 'Event.id')
        .leftOuterJoin('ActivityType as   at_mia', 'at_mia.id', 'mia.activity_type_id')

        .leftOuterJoin('NestingActivity as nes', 'nes.event_id', 'Event.id')
        .leftOuterJoin('ActivityType as at_nes', 'at_nes.id', 'nes.activity_type_id')

        .leftOuterJoin('SampleActivity as sam', 'sam.event_id', 'Event.id')
        .leftOuterJoin('ActivityType as     at_sam', 'at_sam.id', 'sam.activity_type_id')

        .leftOuterJoin('WeatherActivity as wea', 'wea.event_id','Event.id')
        .leftOuterJoin('ActivityType as at_wea', 'at_wea.id', 'wea.activity_type_id')

        .leftOuterJoin('WeightActivity as wei', 'wei.event_id', 'Event.id')
        .leftOuterJoin('ActivityType as at_wei', 'at_wei.id', 'wei.activity_type_id')

        .leftOuterJoin('WingTagActivity as win', 'win.event_id', 'Event.id')
        .leftOuterJoin('ActivityType as at_win', 'at_win.id', 'win.activity_type_id')


      const comparisonOperatorMap = KnexComparisonOperatorMap();

      for (const criteria of queryRequest.criteria) {
        const name = criteria.name;
        const operator = comparisonOperatorMap.get(criteria.operator);
        const value: any = getCriteriaValue(criteria);

        if (name === 'activity_type') {
          if(activityTypeMap.get(value)) {
            select = select.where(
                activityTypeMap.get(value) + ".name",
                '=',
                `${value}`,
            );
          }
          else {
            console.error(`Unknown activity type: ${value}`);
          }
        }
        else {
          select = select.where(name, operator, value);
        }
      }

      return select;
    };

    // specify the pagination properties
    let dataQuery = from(selectData()).offset(offset).limit(pageSize);

    //console.log(`dataQuery: ${JSON.stringify(dataQuery.toSQL().toNative())}`);
    this.knexService.logQuery(this.logger, queryRequest.customQuery, dataQuery);

    // specify the ordering properties
    if (queryRequest.orderByName && queryRequest.orderByDir) {
      const orderBy = [];
      orderBy.push({
        column: queryRequest.orderByName,
        order: queryRequest.orderByDir,
        nulls: 'last',
      });
      dataQuery = dataQuery.orderBy(orderBy);
    }

    const dataResults = await dataQuery;

    const countResponse = await from(selectCount());
    const totalCount = Number(countResponse[0].count);

    const response: QueryResponse<any> = {
      resultList: dataResults,
      totalCount: totalCount,
    };

    return response;
  }
}
