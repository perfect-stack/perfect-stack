import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataService } from './data/data.service';
import { MetaEntityService } from './meta/meta-entity/meta-entity.service';
import { MetaMenuService } from './meta/meta-menu/meta-menu.service';
import { CustomQueryService } from './data/custom-query.service';
import { QueryRequest } from './data/query.request';
import { QueryResponse } from './data/query.response';
import { KnexService } from './knex/knex.service';
import {
  getCriteriaValue,
  KnexComparisonOperatorMap,
} from './data/query-utils';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AppService.name);

  constructor(
    protected readonly metaEntityService: MetaEntityService,
    protected readonly metaMenuService: MetaMenuService,
    protected readonly dataService: DataService,
    protected readonly customQueryService: CustomQueryService,
    protected readonly knexService: KnexService,
  ) {}

  get(): string {
    this.logger.log('Health check is ok.');
    return `Health check ok at: ${new Date().toISOString()}. The version is: ${
      this.metaMenuService.getVersion().serverRelease
    }`;
  }

  async onApplicationBootstrap(): Promise<any> {
    await this.metaEntityService.syncMetaModelWithDatabase(false);
    this.addEventSearchCriteriaQuery();
    return;
  }

  private addEventSearchCriteriaQuery() {
    const eventSearchCriteriaQuery = {
      findByCriteria: async (
        queryRequest: QueryRequest,
      ): Promise<QueryResponse<any>> => {
        let pageNumber = queryRequest.pageNumber;
        let pageSize = queryRequest.pageSize;

        if (!pageNumber) {
          pageNumber = 1;
        }

        if (!pageSize) {
          pageSize = 50;
        }
        const offset = (pageNumber - 1) * pageSize;

        const knex = this.knexService.knex;
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
            knex.raw(
              'concat("HealthActivity".activity_type, \',\', "WeightActivity".activity_type, \',\', "MeasurementActivity".activity_type) as activities',
            ),
          );

        const selectCount = () => knex.select().count();

        const from = (select) => {
          select = select
            .from('Event')
            .leftOuterJoin('Bird', 'Bird.id', 'Event.bird_id')
            .leftOuterJoin('Species', 'Species.id', 'Event.species_id')
            .leftOuterJoin(
              'HealthActivity',
              'HealthActivity.event_id',
              'Event.id',
            )
            .leftOuterJoin(
              'WeightActivity',
              'WeightActivity.event_id',
              'Event.id',
            )
            .leftOuterJoin(
              'MeasurementActivity',
              'MeasurementActivity.event_id',
              'Event.id',
            );

          const comparisonOperatorMap = KnexComparisonOperatorMap();

          for (const criteria of queryRequest.criteria) {
            const name = criteria.name;
            const operator = comparisonOperatorMap.get(criteria.operator);
            const value: any = getCriteriaValue(criteria);

            if (name === 'activity_type') {
              switch (value) {
                case 'Health':
                  select = select.where(
                    'HealthActivity.activity_type',
                    '=',
                    'Health',
                  );
                  break;
                case 'Weight':
                  select = select.where(
                    'WeightActivity.activity_type',
                    '=',
                    'Weight',
                  );
                  break;
                case 'Measurement':
                  select = select.where(
                    'MeasurementActivity.activity_type',
                    '=',
                    'Measurement',
                  );
                  break;
                default:
                  throw new Error(`Unknown activity type of ${value}`);
              }
            } else {
              select = select.where(name, operator, value);
            }
          }

          return select;
        };

        // specify the pagination properties
        let dataQuery = from(selectData()).offset(offset).limit(pageSize);

        console.log(
          `dataQuery: ${JSON.stringify(dataQuery.toSQL().toNative())}`,
        );

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
      },
    };

    this.customQueryService.addCustomQuery(
      'EventSearchByCriteria',
      eventSearchCriteriaQuery,
    );
  }
}
