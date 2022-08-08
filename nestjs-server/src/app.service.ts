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
import { DataEventListener, EventService } from './event/event.service';
import { MetaEntity } from './domain/meta.entity';
import { QueryService } from './data/query.service';
import { ResultType, ValidationResultMap } from './domain/meta.rule';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AppService.name);

  constructor(
    protected readonly metaEntityService: MetaEntityService,
    protected readonly metaMenuService: MetaMenuService,
    protected readonly dataService: DataService,
    protected readonly queryService: QueryService,
    protected readonly customQueryService: CustomQueryService,
    protected readonly knexService: KnexService,
    protected readonly eventService: EventService,
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
    this.addBandingActivityListener();
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

  private addBandingActivityListener() {
    this.eventService.addDataEventListener(
      'Event',
      new BandingActivityDataEventListener(
        this.dataService,
        this.queryService,
        this.knexService,
      ),
    );
  }
}

export class BandingActivityDataEventListener implements DataEventListener {
  private readonly logger = new Logger(BandingActivityDataEventListener.name);

  constructor(
    protected readonly dataService: DataService,
    protected readonly queryService: QueryService,
    protected readonly knexService: KnexService,
  ) {}

  private findBandingActivityIndex(activityList: any[]): number | null {
    if (activityList) {
      return activityList.findIndex((s: any) => s.activity_type === 'Banding');
    } else {
      return null;
    }
  }

  async isAttributeValueUniqueForBird(
    attributeName: string,
    value: string,
    id: string,
  ) {
    // select count(*) from table where attributeName = :value and id <> :id
    const knex = await this.knexService.getKnex();
    const results: any[] = await knex
      .select()
      .from('Bird')
      .where(attributeName, '=', value)
      .andWhere('id', '<>', id)
      .limit(1);

    // valid if count(*) === 0
    const valid = results.length === 0;
    return valid;
  }

  async onBeforeSave(
    entity: any,
    metaEntity: MetaEntity,
    metaEntityMap: Map<string, MetaEntity>,
  ): Promise<ValidationResultMap> {
    this.logger.log(`BandingActivityDataEventListener: onBeforeSave()`);

    const validationResultMap = {};

    const bandingActivityIdx = this.findBandingActivityIndex(entity.activities);
    if (bandingActivityIdx >= 0) {
      const bandingActivity = entity.activities[bandingActivityIdx];
      if (bandingActivity) {
        const bird_id = entity.bird_id;
        if (!bird_id) {
          validationResultMap[`activities.${bandingActivityIdx}.band`] = {
            name: 'band',
            resultType: ResultType.Error,
            message:
              'Unable to validate activity, no Bird is attached to the event',
          };
        }

        const band = bandingActivity.band;
        if (!band) {
          validationResultMap[`activities.${bandingActivityIdx}.band`] = {
            name: 'band',
            resultType: ResultType.Error,
            message: 'Band value is mandatory if activity has been added',
          };
        }

        const unique = await this.isAttributeValueUniqueForBird(
          'band',
          band,
          bird_id,
        );

        if (!unique) {
          validationResultMap[`activities.${bandingActivityIdx}.band`] = {
            name: 'band',
            resultType: ResultType.Error,
            message: 'The value supplied already exists on another Bird',
          };
        }
      }
    }

    return validationResultMap;
  }

  async onAfterSave(metaEntity: MetaEntity, entity: any) {
    this.logger.log(`BandingActivityDataEventListener: onAfterSave()`);
    const activityList: [] = entity.activities;
    if (activityList) {
      const bandingActivity: any = activityList.find(
        (s: any) => s.activity_type === 'Banding',
      );

      if (bandingActivity) {
        this.logger.log(
          `Found Banding activity with band = ${
            bandingActivity.band
          }. ${JSON.stringify(bandingActivity)}`,
        );
        const bird_id = entity.bird_id;
        if (bird_id) {
          const bird = (await this.queryService.findOne(
            'Bird',
            bird_id,
          )) as any;

          if (bird) {
            this.logger.log(`Found Bird: ${bird.name} ${bird.id}`);
            if (bird.band !== bandingActivity.band) {
              this.logger.log(
                `Detected different bands. Update Bird: ${bird.name} from ${bird.band} to band = ${bandingActivity.band}`,
              );
              bird.band = bandingActivity.band;
              await this.dataService.save('Bird', bird);
            } else {
              // This can happen if someone updates an event as well as funny situations where they updated the Bird
              // directly with a new Band and then added the Event. The net effect should be the same, the right band
              // value should be on the bird.
              this.logger.log(`Band is the same so no update required.`);
            }
          } else {
            // No Bird found?
          }
        }
      }
    }
  }
}
