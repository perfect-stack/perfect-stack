import { Module } from '@nestjs/common';
import { EventSearchCriteriaQuery } from './event-search-criteria.query';
import { BandingActivityDataEventListener } from './banding-activity.data-listener';
import { KnexModule } from '../knex/knex.module';
import { EventModule } from '../event/event.module';
import { MetaEntityModule } from '../meta/meta-entity/meta-entity.module';
import { MapModule } from '../map/map.module';

@Module({
  imports: [KnexModule, EventModule, MapModule, MetaEntityModule],
  providers: [EventSearchCriteriaQuery, BandingActivityDataEventListener],
  exports: [EventSearchCriteriaQuery, BandingActivityDataEventListener],
})
export class AppEventModule {}
