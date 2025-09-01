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
import { ProjectBirdsQuery } from './app-event/project-birds.query';
import { ProjectTeamQuery } from './app-event/project-team.query';
import { SettingsService } from './settings/settings.service';
import { CustomRuleService } from './data/rule/custom-rule.service';
import {
  ResultType,
  RuleValidator,
  ValidationResult,
} from './domain/meta.rule';
import { MetaAttribute } from './domain/meta.entity';
import { EventDataListener } from './app-event/event.data-listener';
import { MapService } from './map/map.service';
import {BirdDataListener} from "./app-event/bird.data-listener";
import {MediaRepositoryService} from "./media/media-repository.service";
import {DiscriminatorService} from "./data/discriminator.service";
import {BirdQuery} from "./app-event/bird.query";
import {BatchController} from "@app/batch/batch.controller";
import {AgeClassBatchJob} from "@app/app-event/age-class.batchjob";
import {BatchService} from "@app/batch/batch.service";

@Injectable()
export class AppService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AppService.name);

  constructor(
    protected readonly metaEntityService: MetaEntityService,
    protected readonly metaMenuService: MetaMenuService,
    protected readonly mapService: MapService,
    protected readonly dataService: DataService,
    protected readonly queryService: QueryService,
    protected readonly batchService: BatchService,
    protected readonly customQueryService: CustomQueryService,
    protected readonly customRuleService: CustomRuleService,
    protected readonly knexService: KnexService,
    protected readonly discriminatorService: DiscriminatorService,
    protected readonly mediaRepositoryService: MediaRepositoryService,
    protected readonly eventService: EventService,
    protected readonly settingsService: SettingsService,
    protected readonly ageClassBatchJob: AgeClassBatchJob,
  ) {}

  get(): string {
    this.logger.log('Health check is ok.');
    return `Health check ok at: ${new Date().toISOString()}. The version is: ${
      this.metaMenuService.getVersion().serverRelease
    }`;
  }

  async onApplicationBootstrap(): Promise<any> {
    await this.metaEntityService.syncMetaModelWithDatabase(false);

    this.addBirdQuery();
    this.addEventSearchCriteriaQuery();
    this.addPersonSearchQuery();
    this.addProjectBirdsQuery();
    this.addProjectTeamQuery();

    this.addBandingActivityListener();
    this.addBirdDataListener()
    this.addEventDataListener();

    this.addCustomRules();

    this.addAgeClassBatchJob();

    return;
  }

  private addBirdQuery() {
    this.customQueryService.addCustomQuery(
        "BirdQuery",
        new BirdQuery(this.knexService, this.metaEntityService)
    );
  }

  private addEventSearchCriteriaQuery() {
    this.customQueryService.addCustomQuery(
      'EventSearchByCriteria',
      new EventSearchCriteriaQuery(this.knexService, this.metaEntityService, this.discriminatorService),
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
        this.metaEntityService,
        this.discriminatorService
      ),
    );
  }

  private addBirdDataListener() {
    this.eventService.addDataEventListener(
        'Bird',
        new BirdDataListener(this.mediaRepositoryService),
    )
  }

  private addEventDataListener() {
    this.eventService.addDataEventListener(
      'Event',
      new EventDataListener(this.mapService),
    );
  }

  private addProjectBirdsQuery() {
    this.customQueryService.addCustomQuery(
      'ProjectBirdsQuery',
      new ProjectBirdsQuery(this.knexService, this.metaEntityService),
    );
  }

  private addProjectTeamQuery() {
    this.customQueryService.addCustomQuery(
      'ProjectTeamQuery',
      new ProjectTeamQuery(
        this.knexService,
        this.metaEntityService,
        this.settingsService,
      ),
    );
  }

  private addCustomRules() {
    this.customRuleService.addCustomRule(
      'EventTypeCaptureRule',
      new EventTypeCaptureRule(null, null, null),
    );

    this.customRuleService.addCustomRule(
      'BirdNameRule',
      new BirdNameRule(null, null, null),
    );

    this.customRuleService.addCustomRule(
      'EventLocationRule',
      new EventLocationRule(null, null, null),
    );
  }

  private addAgeClassBatchJob() {
      this.batchService.addBatchJob('age_class', this.ageClassBatchJob);
  }
}

class BirdNameRule extends RuleValidator {
  async validate(
    entity: any,
    attribute: MetaAttribute,
  ): Promise<ValidationResult | null> {
    const birdName = entity['name'];
    if (birdName === null || birdName.length === 0) {
      // at least one marking must be supplied
      const band = entity['band'];
      const microchip = entity['microchip'];
      const wing_tag = entity['wing_tag'];
      if (band || microchip || wing_tag) {
        return null;
      } else {
        return {
          name: attribute.name,
          resultType: ResultType.Error,
          message:
            'If the bird name is not supplied then one marking of; band, microchip or wing tag must be supplied',
        };
      }
    }
  }
}

class EventTypeCaptureRule extends RuleValidator {
  async validate(
    entity: any,
    attribute: MetaAttribute,
  ): Promise<ValidationResult | null> {
    const eventType = entity['event_type'];
    if (eventType === 'Capture') {
      const observers = entity['observers'];
      if (observers.length < 1) {
        return {
          name: attribute.name,
          resultType: ResultType.Error,
          message:
            'If event type is "Capture" then there must be at least one Observer',
        };
      }
    }

    return null;
  }
}

class EventLocationRule extends RuleValidator {
  async validate(
    entity: any,
    attribute: MetaAttribute,
  ): Promise<ValidationResult | null> {
    const northing = entity['northing'];
    const easting = entity['easting'];
    const location_id = entity['location_id'];
    if ((!northing || !easting) && !location_id) {
      return {
        name: attribute.name,
        resultType: ResultType.Error,
        message:
          'If Northing and Easting are not supplied then a saved location must be picked.',
      };
    }
    return null;
  }
}
