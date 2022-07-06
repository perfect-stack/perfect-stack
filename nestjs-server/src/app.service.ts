import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataService } from './data/data.service';
import { MetaEntityService } from './meta/meta-entity/meta-entity.service';
import { MetaMenuService } from './meta/meta-menu/meta-menu.service';
import { CustomQueryService } from './data/custom-query.service';
import { QueryRequest } from './data/query.request';
import { QueryResponse } from './data/query.response';
import { KnexService } from './knex/knex.service';

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
        const knex = this.knexService.knex;

        const events = await knex
          .select(
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
          )
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
          )
          .whereNotNull('date_time');

        const response: QueryResponse<any> = {
          resultList: events,
          totalCount: events.length,
        };

        return new Promise((resolve, reject) => {
          resolve(response);
        });
      },
    };

    this.customQueryService.addCustomQuery(
      'EventSearchByCriteria',
      eventSearchCriteriaQuery,
    );
  }
}
