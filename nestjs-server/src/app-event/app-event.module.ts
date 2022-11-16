import { Module } from '@nestjs/common';
import { EventSearchCriteriaQuery } from './event-search-criteria.query';
import { BandingActivityDataEventListener } from './banding-activity.data-listener';
import { KnexModule } from '../knex/knex.module';
import { EventModule } from '../event/event.module';
import { MetaEntityModule } from '../meta/meta-entity/meta-entity.module';
import { MapModule } from '../map/map.module';
import { CoordinateConverterController } from './coordinate-converter.controller';
import { CoordinateConverterService } from './coordinate-converter.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  controllers: [CoordinateConverterController],
  imports: [
    KnexModule,
    EventModule,
    MapModule,
    MetaEntityModule,
    SettingsModule,
  ],
  providers: [
    EventSearchCriteriaQuery,
    BandingActivityDataEventListener,
    CoordinateConverterService,
  ],
  exports: [
    EventSearchCriteriaQuery,
    BandingActivityDataEventListener,
    CoordinateConverterService,
  ],
})
export class AppEventModule {}
