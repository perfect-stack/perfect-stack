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

@Injectable()
export class EventSearchCriteriaQuery implements CustomQuery {
  private readonly logger = new Logger(EventSearchCriteriaQuery.name);

  constructor(
    protected readonly knexService: KnexService,
    protected readonly metaEntityService: MetaEntityService,
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
        'HealthActivity.activity_type as health_activity',
        'WeightActivity.activity_type as weight_activity',
        'MeasurementActivity.activity_type as measurement_activity',
        'BandingActivity.activity_type as banding_activity',
        'MicrochipActivity.activity_type as microchip_activity',
        'WingTagActivity.activity_type as wing_tag_activity',
        knex.raw(
          'concat("HealthActivity".activity_type, \',\', "WeightActivity".activity_type, \',\', "MeasurementActivity".activity_type, \',\', "BandingActivity".activity_type, \',\', "MicrochipActivity".activity_type, \',\', "WingTagActivity".activity_type) as activities',
        ),
      );

    const selectCount = () => knex.select().count();

    const from = (select) => {
      select = select
        .from('Event')
        .leftOuterJoin('Bird', 'Bird.id', 'Event.bird_id')
        .leftOuterJoin('Species', 'Species.id', 'Event.species_id')
        .leftOuterJoin('HealthActivity', 'HealthActivity.event_id', 'Event.id')
        .leftOuterJoin('WeightActivity', 'WeightActivity.event_id', 'Event.id')
        .leftOuterJoin(
          'MeasurementActivity',
          'MeasurementActivity.event_id',
          'Event.id',
        )
        .leftOuterJoin(
          'BandingActivity',
          'BandingActivity.event_id',
          'Event.id',
        )
        .leftOuterJoin(
          'MicrochipActivity',
          'MicrochipActivity.event_id',
          'Event.id',
        )
        .leftOuterJoin(
          'WingTagActivity',
          'WingTagActivity.event_id',
          'Event.id',
        );

      const comparisonOperatorMap = KnexComparisonOperatorMap();

      for (const criteria of queryRequest.criteria) {
        const name = criteria.name;
        const operator = comparisonOperatorMap.get(criteria.operator);
        const value: any = getCriteriaValue(criteria);

        if (name === 'activity_type') {
          const attribute = metaEntity.attributes.find(
            (s) => s.name === 'activities',
          );
          const discriminator = attribute.discriminator;
          const entityMapping = discriminator.entityMappingList.find(
            (s) => s.discriminatorValue === value,
          );

          select = select.where(
            `${entityMapping.metaEntityName}.activity_type`,
            '=',
            `${entityMapping.discriminatorValue}`,
          );
        } else {
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
