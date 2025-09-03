import { Module } from '@nestjs/common';
import { EventSearchCriteriaQuery } from './event-search-criteria.query';
import { BandingActivityDataEventListener } from './banding-activity.data-listener';
import { KnexModule } from '../knex/knex.module';
import { EventModule } from '../event/event.module';
import { MetaEntityModule } from '../meta/meta-entity/meta-entity.module';
import { MapModule } from '../map/map.module';
import { CoordinateConverterService } from './batch/coordinate-converter.service';
import { SettingsModule } from '../settings/settings.module';
import {DataModule} from "../data/data.module";
import {BirdQuery} from "./bird.query";
import {AgeClassBatchJob} from "@app/app-event/batch/age-class.batchjob";
import {ActivityService} from "@app/app-event/activity.service";

@Module({
  imports: [
    KnexModule,
    EventModule,
    MapModule,
    DataModule,
    MetaEntityModule,
    SettingsModule,
  ],
  providers: [
    ActivityService,
    AgeClassBatchJob,
    BirdQuery,
    EventSearchCriteriaQuery,
    BandingActivityDataEventListener,
    CoordinateConverterService,
  ],
  exports: [
    ActivityService,
    AgeClassBatchJob,
    BirdQuery,
    EventSearchCriteriaQuery,
    BandingActivityDataEventListener,
    CoordinateConverterService,
  ],
})
export class AppEventModule {}
