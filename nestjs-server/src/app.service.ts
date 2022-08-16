import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataService } from './data/data.service';
import { MetaEntityService } from './meta/meta-entity/meta-entity.service';
import { MetaMenuService } from './meta/meta-menu/meta-menu.service';
import { CustomQueryService } from './data/custom-query.service';
import { KnexService } from './knex/knex.service';
import { EventService } from './event/event.service';
import { QueryService } from './data/query.service';
import { BandingActivityDataEventListener } from './app-event/banding-activity.data-listener';
import { EventSearchCriteriaQuery } from './app-event/event-search-criteria.query';
import { PersonSearchQuery } from './app-event/person-search.query';

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
    this.addPersonSearchQuery();
    this.addBandingActivityListener();
    return;
  }

  private addEventSearchCriteriaQuery() {
    this.customQueryService.addCustomQuery(
      'EventSearchByCriteria',
      new EventSearchCriteriaQuery(this.knexService, this.metaEntityService),
    );
  }

  private addPersonSearchQuery() {
    this.customQueryService.addCustomQuery(
      'PersonSearch',
      new PersonSearchQuery(this.knexService, this.metaEntityService),
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

  /* private addEventSearchCriteriaQuery() {
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
   }*/
}

/*
export class BandingActivityDataEventListener implements DataEventListener {
  private readonly logger = new Logger(BandingActivityDataEventListener.name);

  private readonly markings = [
    {
      attribute_name: 'band',
      activity_type: 'Banding',
    },
    {
      attribute_name: 'microchip',
      activity_type: 'Microchip',
    },
    {
      attribute_name: 'wing_tag',
      activity_type: 'Wing tag',
    },
  ];

  constructor(
    protected readonly dataService: DataService,
    protected readonly queryService: QueryService,
    protected readonly knexService: KnexService,
  ) {}

  private findActivityIndex(
    activityList: any[],
    activity_type: string,
  ): number | null {
    if (activityList) {
      return activityList.findIndex(
        (s: any) => s.activity_type === activity_type,
      );
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

    for (const nextMarking of this.markings) {
      await this.validateMarking(
        entity,
        nextMarking.attribute_name,
        nextMarking.activity_type,
        validationResultMap,
      );
    }

    return validationResultMap;
  }

  private async validateMarking(
    entity: any,
    attribute_name: string,
    activity_type: string,
    validationResultMap: ValidationResultMap,
  ) {
    const activityIndex = this.findActivityIndex(
      entity.activities,
      activity_type,
    );

    if (activityIndex >= 0) {
      const activity = entity.activities[activityIndex];
      if (activity) {
        const bird_id = entity.bird_id;
        if (!bird_id) {
          validationResultMap[`activities.${activityIndex}.${attribute_name}`] =
            {
              name: attribute_name,
              resultType: ResultType.Error,
              message:
                'Unable to validate activity, no Bird is attached to the event',
            };
        }

        const marking = activity[attribute_name];
        if (marking) {
          const unique = await this.isAttributeValueUniqueForBird(
            attribute_name,
            marking,
            bird_id,
          );

          if (!unique) {
            validationResultMap[
              `activities.${activityIndex}.${attribute_name}`
            ] = {
              name: attribute_name,
              resultType: ResultType.Error,
              message: 'The value supplied already exists on another Bird',
            };
          }
        } else {
          validationResultMap[`activities.${activityIndex}.${attribute_name}`] =
            {
              name: attribute_name,
              resultType: ResultType.Error,
              message: 'Value is mandatory if activity has been added',
            };
        }
      }
    }
  }

  async onAfterSave(entity: any, metaEntity: MetaEntity) {
    this.logger.log(`BandingActivityDataEventListener: onAfterSave()`);

    // check if there are any marking activities to worry about
    if (this.hasMarkingActivities(entity)) {
      // if there are load the bird once at the start
      const bird = await this.loadBird(entity);

      // do all the updates (validation has already been checked above)
      for (const nextMarking of this.markings) {
        await this.updateMarking(
          entity,
          nextMarking.attribute_name,
          nextMarking.activity_type,
          bird,
        );
      }

      // do the save of the bird once at the end
      await this.dataService.save('Bird', bird);
    }
  }

  hasMarkingActivities(entity: any) {
    const activityList: [] = entity.activities;
    if (activityList) {
      for (const nextMarking of this.markings) {
        if (
          this.findActivityIndex(activityList, nextMarking.activity_type) >= 0
        ) {
          return true;
        }
      }
    }
    return false;
  }

  async loadBird(entity: any): Promise<Entity> {
    return await this.queryService.findOne('Bird', entity.bird_id);
  }

  private async updateMarking(
    entity: any,
    attribute_name: string,
    activity_type: string,
    bird: any,
  ) {
    const activityIdx = this.findActivityIndex(
      entity.activities,
      activity_type,
    );

    if (activityIdx >= 0) {
      const activity = entity.activities[activityIdx];
      if (activity) {
        this.logger.log(
          `Found ${activity_type} activity with ${attribute_name} = ${activity[attribute_name]}.`,
        );
        const bird_id = entity.bird_id;
        if (bird_id) {
          if (bird) {
            this.logger.log(`Found Bird: ${bird.name}, ${bird.id}`);
            if (bird[attribute_name] !== activity[attribute_name]) {
              this.logger.log(
                `Detected different ${attribute_name}. Update Bird: ${bird.name} ${attribute_name} from ${bird[attribute_name]} to ${activity[attribute_name]}`,
              );
              bird[attribute_name] = activity[attribute_name];
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
      } else {
        this.logger.log(`No ${activity_type} activity found`);
      }
    }
  }
}
*/
