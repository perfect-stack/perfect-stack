import { Module } from '@nestjs/common';
import { EventSearchCriteriaQuery } from './event-search-criteria.query';
import { BandingActivityDataEventListener } from './banding-activity.data-listener';
import { KnexModule } from '../knex/knex.module';
import { EventModule } from '../event/event.module';
import { MetaEntityModule } from '../meta/meta-entity/meta-entity.module';

@Module({
  imports: [KnexModule, EventModule, MetaEntityModule],
  providers: [EventSearchCriteriaQuery, BandingActivityDataEventListener],
  exports: [EventSearchCriteriaQuery, BandingActivityDataEventListener],
})
export class AppEventModule {}
