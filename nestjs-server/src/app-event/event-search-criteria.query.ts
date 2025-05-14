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

    const metaEntity = await this.metaEntityService.findOne('Event');

    const knex = await this.knexService.getKnex();
    const selectData = () =>
      knex.select(
        'Event.id',
        'Event.date_time',
        'Bird.name as bird',
        'Bird.band as band',
        'Species.name as species',
        'Event.form as form',
        'Event.event_type as event_type',
        // 'HealthActivity.activity_type as health_activity',
        // 'WeightActivity.activity_type as weight_activity',
        // 'MeasurementActivity.activity_type as measurement_activity',
        // 'BandingActivity.activity_type_id as banding_activity',
        // 'MicrochipActivity.activity_type as microchip_activity',
        // 'WingTagActivity.activity_type as wing_tag_activity',
        // 'CallCountActivity.activity_type as call_count_activity',
        // 'WeatherActivity.activity_type as weather_activity',

        // knex.raw(
        //   'concat("HealthActivity".activity_type, \',\', "WeightActivity".activity_type, \',\', "MeasurementActivity".activity_type, \',\', "BandingActivity".activity_type_id, \',\', "MicrochipActivity".activity_type, \',\', "WingTagActivity".activity_type, \',\', "CallCountActivity".activity_type, \',\', "WeatherActivity".activity_type) as activities',
        // ),

        knex.raw(
            "concat(at_mea.name, ',', at_baa.name, ',', at_mia.name, ',') as activities",
        ),
      );

    const selectCount = () => knex.select().count();

    const activitiesAttribute = metaEntity.attributes['activities'];
    //const discriminatorMap = await this.discriminatorService.findDiscriminatorMap(activitiesAttribute);

    const from = (select) => {
      select = select
        .from('Event')
        .leftOuterJoin('Bird', 'Bird.id', 'Event.bird_id')
        .leftOuterJoin('Species', 'Species.id', 'Event.species_id')
//        .leftOuterJoin('HealthActivity', 'HealthActivity.event_id', 'Event.id')
//        .leftOuterJoin('WeightActivity', 'WeightActivity.event_id', 'Event.id')
        .leftOuterJoin('MeasurementActivity as mea', 'mea.event_id', 'Event.id')
        .leftOuterJoin('ActivityType as     at_mea', 'at_mea.id', 'mea.activity_type_id')
        .leftOuterJoin('BandingActivity as baa', 'baa.event_id', 'Event.id')
        .leftOuterJoin('ActivityType as at_baa', 'at_baa.id', 'baa.activity_type_id')
        .leftOuterJoin('MicrochipActivity as mia', 'mia.event_id', 'Event.id')
        .leftOuterJoin('ActivityType as   at_mia', 'at_mia.id', 'mia.activity_type_id')
        // .leftOuterJoin('WingTagActivity', 'WingTagActivity.event_id', 'Event.id')
        // .leftOuterJoin('CallCountActivity', 'CallCountActivity.event_id','Event.id')
        // .leftOuterJoin('WeatherActivity', 'WeatherActivity.event_id','Event.id');

      const comparisonOperatorMap = KnexComparisonOperatorMap();

      for (const criteria of queryRequest.criteria) {
        const name = criteria.name;
        const operator = comparisonOperatorMap.get(criteria.operator);
        const value: any = getCriteriaValue(criteria);

        if (name === 'activity_type') {

          const activityTypeMap = new Map<string, string>();
          activityTypeMap.set('Banding', 'at_baa');
          activityTypeMap.set('Measurement', 'at_mea');
          activityTypeMap.set('Microchip', 'at_mia');

          select = select.where(
            activityTypeMap.get(value) + ".name",
            '=',
            `${value}`,
          );
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
