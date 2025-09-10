import { Module } from '@nestjs/common';
import { EventSearchCriteriaQuery } from './event-search-criteria.query';
import { BandingActivityDataEventListener } from './banding-activity.data-listener';
import {KnexModule} from "@perfect-stack/nestjs-server/knex/knex.module";
import {EventModule} from "@perfect-stack/nestjs-server/event/event.module";
import {MapModule} from "@perfect-stack/nestjs-server/map/map.module";
import {DataModule} from "@perfect-stack/nestjs-server/data/data.module";
import {MetaEntityModule} from "@perfect-stack/nestjs-server/meta/meta-entity/meta-entity.module";
import {SettingsModule} from "@perfect-stack/nestjs-server/settings/settings.module";
import {ActivityService} from "./activity.service";
import {AgeClassBatchJob} from "./batch/age-class.batchjob";
import {BirdQuery} from "./bird.query";
import {CoordinateConverterService} from "./batch/coordinate-converter.service";
import {DbSnapshotBatchjob} from "./batch/db-snapshot.batchjob";
import {RdsProvider} from "./batch/rds.provider";

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
    DbSnapshotBatchjob,
    RdsProvider
  ],
  exports: [
    ActivityService,
    AgeClassBatchJob,
    BirdQuery,
    EventSearchCriteriaQuery,
    BandingActivityDataEventListener,
    CoordinateConverterService,
    DbSnapshotBatchjob
  ],
})
export class AppEventModule {}
