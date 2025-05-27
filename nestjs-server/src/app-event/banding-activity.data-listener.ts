import { Logger } from '@nestjs/common';
import { QueryService } from '../data/query.service';
import { KnexService } from '../knex/knex.service';
import { DataService } from '../data/data.service';
import { DataEventListener } from '../event/event.service';
import { ResultType, ValidationResultMap } from '../domain/meta.rule';
import { MetaEntity } from '../domain/meta.entity';
import { Entity } from '../domain/entity';
import {DiscriminatorMapping, DiscriminatorService} from "../data/discriminator.service";
import {MetaEntityService} from "../meta/meta-entity/meta-entity.service";

interface Marking {
  activity_attribute_name: string;
  bird_attribute_name: string;
  activity_type: string;
}

export class BandingActivityDataEventListener implements DataEventListener {
  private readonly logger = new Logger(BandingActivityDataEventListener.name);

  private readonly markings: Marking[] = [
    {
      activity_attribute_name: 'band',
      bird_attribute_name: 'band_number',
      activity_type: 'Banding',
    },
    {
      activity_attribute_name: 'colour_band',
      bird_attribute_name: 'colour_band',
      activity_type: 'Banding',
    },
    {
      activity_attribute_name: 'microchip',
      bird_attribute_name: 'microchip',
      activity_type: 'Microchip',
    },
    {
      activity_attribute_name: 'wing_tag',
      bird_attribute_name: 'wing_tag',
      activity_type: 'Wing tag',
    },
  ];

  private _discriminatorMap: Map<string, DiscriminatorMapping>;

  constructor(
    protected readonly dataService: DataService,
    protected readonly queryService: QueryService,
    protected readonly knexService: KnexService,
    protected readonly metaEntityService: MetaEntityService,
    protected readonly discriminatorService: DiscriminatorService,
  ) {}

  private async getDiscriminatorMap() {
    if(!this._discriminatorMap) {
      const eventMetaEntity = await this.metaEntityService.findOne("Event");
      console.log('eventMetaEntity:', eventMetaEntity);
      let activitiesAttribute = eventMetaEntity.attributes.find(s => s.name === 'activities');
      console.log(`activitiesAttribute: ${activitiesAttribute}`)
      this._discriminatorMap = await this.discriminatorService.findDiscriminatorMap(activitiesAttribute);
    }
    return this._discriminatorMap;
  }

  private async findActivityIndex(
    activityList: any[],
    activity_type: string,
  ): Promise<number | null> {
    if (activityList) {
      const discriminatorMap = await this.getDiscriminatorMap();
      const activityType = discriminatorMap.get(activity_type);
      if(activityType) {
        return activityList.findIndex((s: any) => s.activity_type_id === activityType.discriminatorId);
      }
      else {
        throw new Error(`Unable to find discriminator for ${activity_type}`);
      }
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
      .where(knex.raw(`LOWER(${attributeName}) = '${value.toLowerCase()}'`))
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
        nextMarking,
        validationResultMap,
      );
    }

    return validationResultMap;
  }

  private async validateMarking(
    entity: any,
    markingAttribute: Marking,
    validationResultMap: ValidationResultMap,
  ) {
    const activityIndex = await this.findActivityIndex(
      entity.activities,
      markingAttribute.activity_type,
    );

    if (activityIndex >= 0) {
      const activity = entity.activities[activityIndex];
      if (activity) {
        const bird_id = entity.bird_id;
        if (!bird_id) {
          validationResultMap[`activities.${activityIndex}.${markingAttribute.activity_attribute_name}`] =
            {
              name: markingAttribute.activity_attribute_name,
              resultType: ResultType.Error,
              message:
                'Unable to validate activity, no Bird is attached to the event',
            };
        }

        const marking = activity[markingAttribute.activity_attribute_name];
        if (marking) {
          const unique = await this.isAttributeValueUniqueForBird(
            markingAttribute.bird_attribute_name,
            marking,
            bird_id,
          );

          if (!unique) {
            validationResultMap[
              `activities.${activityIndex}.${markingAttribute.activity_attribute_name}`
            ] = {
              name: markingAttribute.activity_attribute_name,
              resultType: ResultType.Error,
              message:
                'The value supplied already exists on another Bird (case insensitive)',
            };
          }
        } else {
          validationResultMap[`activities.${activityIndex}.${markingAttribute.activity_attribute_name}`] =
            {
              name: markingAttribute.activity_attribute_name,
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
    if (await this.hasMarkingActivities(entity)) {
      // if there are load the bird once at the start
      const bird = await this.loadBird(entity);

      // do all the updates (validation has already been checked above)
      for (const nextMarking of this.markings) {
        await this.updateMarking(
          entity,
          nextMarking,
          bird,
        );
      }

      // do the save of the bird once at the end
      await this.dataService.save('Bird', bird);
    }
  }

  async hasMarkingActivities(entity: any) {
    const activityList: [] = entity.activities;
    if (activityList) {
      for (const nextMarking of this.markings) {
        if ((await this.findActivityIndex(activityList, nextMarking.activity_type)) >= 0) {
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
    markingAttribute: Marking,
    bird: any,
  ) {
    const activityIdx = await this.findActivityIndex(
      entity.activities,
      markingAttribute.activity_type,
    );

    if (activityIdx >= 0) {
      const activity = entity.activities[activityIdx];
      if (activity) {
        this.logger.log(
          `Found ${activity.activity_type} activity with ${markingAttribute.activity_attribute_name} = ${activity[markingAttribute.activity_attribute_name]}.`,
        );
        const bird_id = entity.bird_id;
        if (bird_id) {
          if (bird) {
            this.logger.log(`Found Bird: ${bird.name}, ${bird.id}`);
            if (bird[markingAttribute.bird_attribute_name] !== activity[markingAttribute.activity_attribute_name]) {
              this.logger.log(
                `Detected different ${markingAttribute.activity_attribute_name}. Update Bird: ${bird.name} ${markingAttribute.bird_attribute_name} from ${bird[markingAttribute.bird_attribute_name]} to ${activity[markingAttribute.activity_attribute_name]}`,
              );
              bird[markingAttribute.bird_attribute_name] = activity[markingAttribute.activity_attribute_name];
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
        this.logger.log(`No ${activity.activity_type} activity found`);
      }
    }
  }
}
