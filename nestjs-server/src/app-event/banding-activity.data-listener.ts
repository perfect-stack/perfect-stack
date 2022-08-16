import { Logger } from '@nestjs/common';
import { QueryService } from '../data/query.service';
import { KnexService } from '../knex/knex.service';
import { DataService } from '../data/data.service';
import { DataEventListener } from '../event/event.service';
import { ResultType, ValidationResultMap } from '../domain/meta.rule';
import { MetaEntity } from '../domain/meta.entity';
import { Entity } from '../domain/entity';

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
