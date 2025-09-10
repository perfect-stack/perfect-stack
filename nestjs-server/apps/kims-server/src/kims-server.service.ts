import {Injectable, Logger, OnApplicationBootstrap} from '@nestjs/common';
import {MetaMenuService} from "@perfect-stack/nestjs-server/meta/meta-menu/meta-menu.service";
import {ResultType, RuleValidator, ValidationResult} from "@perfect-stack/nestjs-server/domain/meta.rule";
import {MetaAttribute} from "@perfect-stack/nestjs-server/domain/meta.entity";
import {MetaEntityService} from "@perfect-stack/nestjs-server/meta/meta-entity/meta-entity.service";
import {MapService} from "@perfect-stack/nestjs-server/map/map.service";
import {DataService} from "@perfect-stack/nestjs-server/data/data.service";
import {QueryService} from "@perfect-stack/nestjs-server/data/query.service";
import {BatchService} from "@perfect-stack/nestjs-server/batch/batch.service";
import {CustomQueryService} from "@perfect-stack/nestjs-server/data/custom-query.service";
import {CustomRuleService} from "@perfect-stack/nestjs-server/data/rule/custom-rule.service";
import {KnexService} from "@perfect-stack/nestjs-server/knex/knex.service";
import {DiscriminatorService} from "@perfect-stack/nestjs-server/data/discriminator.service";
import {MediaRepositoryService} from "@perfect-stack/nestjs-server/media/media-repository.service";
import {EventService} from "@perfect-stack/nestjs-server/event/event.service";
import {SettingsService} from "@perfect-stack/nestjs-server/settings/settings.service";
import {ActivityService} from "./app-event/activity.service";
import {AgeClassBatchJob} from "./app-event/batch/age-class.batchjob";
import {CoordinateConverterService} from "./app-event/batch/coordinate-converter.service";
import {BirdQuery} from "./app-event/bird.query";
import {EventSearchCriteriaQuery} from "./app-event/event-search-criteria.query";
import {PersonSearchQuery} from "./app-event/person-search.query";
import {BandingActivityDataEventListener} from "./app-event/banding-activity.data-listener";
import {DeathActivityDataListener} from "./app-event/death-activity.data-listener";
import {BirdDataListener} from "./app-event/bird.data-listener";
import {EventDataListener} from "./app-event/event.data-listener";
import {ProjectBirdsQuery} from "./app-event/project-birds.query";
import {ProjectTeamQuery} from "./app-event/project-team.query";
import {DbSnapshotBatchjob} from "./app-event/batch/db-snapshot.batchjob";

@Injectable()
export class KimsServerService implements OnApplicationBootstrap {

    private readonly logger = new Logger(KimsServerService.name);

    constructor(
        protected readonly metaEntityService: MetaEntityService,
        protected readonly metaMenuService: MetaMenuService,
        protected readonly mapService: MapService,
        protected readonly dataService: DataService,
        protected readonly queryService: QueryService,
        protected readonly batchService: BatchService,
        protected readonly customQueryService: CustomQueryService,
        protected readonly customRuleService: CustomRuleService,
        protected readonly dbSnapshotBatchjob: DbSnapshotBatchjob,
        protected readonly knexService: KnexService,
        protected readonly discriminatorService: DiscriminatorService,
        protected readonly mediaRepositoryService: MediaRepositoryService,
        protected readonly eventService: EventService,
        protected readonly settingsService: SettingsService,
        protected readonly activityService: ActivityService,
        protected readonly ageClassBatchJob: AgeClassBatchJob,
        protected readonly coordinateConverterService: CoordinateConverterService,
    ) {}


    getHealth(): string {
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
        this.addDeathActivityListener();
        this.addBirdDataListener()
        this.addEventDataListener();

        this.addCustomRules();

        this.addBatchJobs();

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
                this.activityService
            ),
        );
    }

    private addDeathActivityListener() {
        this.eventService.addDataEventListener(
            'Event',
            new DeathActivityDataListener(this.activityService, this.dataService, this.queryService)
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

    private addBatchJobs() {
        this.batchService.addBatchJob('age_class', this.ageClassBatchJob);
        this.batchService.addBatchJob("coordinate_converter", this.coordinateConverterService);
        this.batchService.addBatchJob("db_snapshot", this.dbSnapshotBatchjob);
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
