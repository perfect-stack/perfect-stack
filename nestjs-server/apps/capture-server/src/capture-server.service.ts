import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { MetaMenuService } from "@perfect-stack/nestjs-server/meta/meta-menu/meta-menu.service";
import { ResultType, RuleValidator, ValidationResult } from "@perfect-stack/nestjs-server/domain/meta.rule";
import { MetaAttribute } from "@perfect-stack/nestjs-server/domain/meta.entity";
import { MetaEntityService } from "@perfect-stack/nestjs-server/meta/meta-entity/meta-entity.service";
import { MapService } from "@perfect-stack/nestjs-server/map/map.service";
import { DataService } from "@perfect-stack/nestjs-server/data/data.service";
import { QueryService } from "@perfect-stack/nestjs-server/data/query.service";
import { BatchService } from "@perfect-stack/nestjs-server/batch/batch.service";
import { CustomQueryService } from "@perfect-stack/nestjs-server/data/custom-query.service";
import { CustomRuleService } from "@perfect-stack/nestjs-server/data/rule/custom-rule.service";
import { KnexService } from "@perfect-stack/nestjs-server/knex/knex.service";
import { DiscriminatorService } from "@perfect-stack/nestjs-server/data/discriminator.service";
import { MediaRepositoryService } from "@perfect-stack/nestjs-server/media/media-repository.service";
import { EventService, SchemaListener } from "@perfect-stack/nestjs-server/event/event.service";
import { SettingsService } from "@perfect-stack/nestjs-server/settings/settings.service";
import { PersonSearchQuery } from "./app-event/person-search.query";
import { MonitoringStationBatchJobService } from "./batch/monitoring-station-batch-job.service";
import { DocMonResetBatchJobService } from "./batch/docmon-reset-batch-job.service";
import { CaptureSchemaListener } from './app-event/capture-schema.listener';
import { StationSensorActivityListener } from './app-event/station-sensor-activity.listener';
// import {ActivityService} from "./app-event/activity.service";
// import {AgeClassBatchJob} from "./app-event/batch/age-class.batchjob";
// import {CoordinateConverterService} from "./app-event/batch/coordinate-converter.service";
// import {BirdQuery} from "./app-event/bird.query";
// import {EventSearchCriteriaQuery} from "./app-event/event-search-criteria.query";
// import {PersonSearchQuery} from "./app-event/person-search.query";
// import {BandingActivityDataListener} from "./app-event/banding-activity.data-listener";
// import {DeathActivityDataListener} from "./app-event/death-activity.data-listener";
// import {BirdDataListener} from "./app-event/bird.data-listener";
// import {EventDataListener} from "./app-event/event.data-listener";
// import {ProjectBirdsQuery} from "./app-event/project-birds.query";
// import {ProjectTeamQuery} from "./app-event/project-team.query";
// import {DbSnapshotBatchjob} from "./app-event/batch/db-snapshot.batchjob";
// import {CaptureSchemaListener} from "./app-event/capture.schema.listener";
// import {NestingActivityDataListener} from "./app-event/nesting-activity.data-listener";


@Injectable()
export class CaptureServerService implements OnApplicationBootstrap {

    private readonly logger = new Logger(CaptureServerService.name);

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
        protected readonly monitoringStationBatchJobService: MonitoringStationBatchJobService,
        protected readonly docMonResetBatchJobService: DocMonResetBatchJobService,
        protected readonly captureSchemaListener: CaptureSchemaListener,
        protected readonly stationSensorActivityListener: StationSensorActivityListener,
        // protected readonly activityService: ActivityService,
        // protected readonly ageClassBatchJob: AgeClassBatchJob,
        // protected readonly coordinateConverterService: CoordinateConverterService,
        //protected readonly captureSchemaListener: CaptureSchemaListener
    ) { }


    getHealth(): string {
        this.logger.log('Health check is ok.');
        return `Health check ok at: ${new Date().toISOString()}. The version is: ${this.metaMenuService.getVersion().serverRelease
            }`;
    }

    async onApplicationBootstrap(): Promise<any> {
        await this.metaEntityService.syncMetaModelWithDatabase(false);

        this.eventService.addSchemaListener(this.captureSchemaListener);
        this.eventService.addDataEventListener("StationSensorActivity", this.stationSensorActivityListener);

        // this.addBirdQuery();
        // this.addEventSearchCriteriaQuery();
        this.addPersonSearchQuery();
        // this.addProjectBirdsQuery();
        // this.addProjectTeamQuery();
        //
        // this.addActivityListeners();
        // this.addBirdDataListener()
        // this.addEventDataListener();

        //this.addCustomRules();
        this.addBatchJobs();

        return;
    }

    /*private addOnSchemaUpdate() {
        this.eventService.addSchemaListener(this.captureSchemaListener);
    }*/

    /*    private addBirdQuery() {
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
        }*/

    private addPersonSearchQuery() {
        this.customQueryService.addCustomQuery(
            'PersonSearch',
            new PersonSearchQuery(this.knexService, this.metaEntityService),
        );
    }

    /*private addActivityListeners() {
        this.eventService.addDataEventListener(
            'Event',
            new BandingActivityDataEventListener(
                this.dataService,
                this.queryService,
                this.knexService,
                this.metaEntityService,
                this.activityService
            ),
        );

        this.eventService.addDataEventListener(
            'Event',
            new DeathActivityDataListener(this.activityService, this.dataService, this.queryService)
        );

        this.eventService.addDataEventListener(
            'Event',
            new NestingActivityDataListener(this.activityService, this.dataService, this.queryService)
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
    }*/

    /*private addCustomRules() {
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
    }*/

    private addBatchJobs() {
        this.batchService.addBatchJob('Monitoring Station', this.monitoringStationBatchJobService);
        this.batchService.addBatchJob('DOCMon Reset', this.docMonResetBatchJobService);
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
