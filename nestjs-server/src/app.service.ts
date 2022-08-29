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
    this.addProjectBirdsQuery();
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

  private addProjectBirdsQuery() {
    this.customQueryService.addCustomQuery(
      'ProjectBirdsQuery',
      new ProjectBirdsQuery(this.knexService, this.metaEntityService),
    );
  }
}
