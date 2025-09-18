import {DataEventListener} from "@perfect-stack/nestjs-server/event/event.service";
import {Logger} from "@nestjs/common";
import {ActivityService} from "./activity.service";
import {DataService, QueryService} from "@perfect-stack/nestjs-server";
import {ResultType, ValidationResultMap} from "@perfect-stack/nestjs-server/domain/meta.rule";
import {MetaEntity} from "@perfect-stack/nestjs-server/domain/meta.entity";


export class NestingActivityDataListener implements DataEventListener {

    private readonly logger = new Logger(NestingActivityDataListener.name);

    constructor(
        protected readonly activityService: ActivityService,
        protected readonly dataService: DataService,
        protected readonly queryService: QueryService
    ) {}

    async onBeforeSave(entity: any, metaEntity: MetaEntity, metaEntityMap: Map<string, MetaEntity>): Promise<ValidationResultMap> {
        this.logger.log('NestingActivityDataListener: onBeforeSave()')
        const validationResultMap = {};

        const activityIndex = await this.activityService.findActivityIndex(
            entity.activities,
            'Nesting',
        );

        if(activityIndex >= 0) {
            const activity = entity.activities[activityIndex];
            if(activity) {
                const nestStatusTypeId = activity.nest_status_type_id;
                this.logger.log('nestStatusTypeId: ' + nestStatusTypeId);
                if(nestStatusTypeId) {
                    const nestStatusType = await this.queryService.findOne('NestStatusType', nestStatusTypeId) as any;
                    this.logger.log('nestStatusType.name: ' + nestStatusType.name);
                    if(nestStatusType && nestStatusType.name === 'Failed') {
                        const nestFailureReasonId = activity.nest_failure_reason_id;
                        this.logger.log('nestFailureReasonId: ' + nestFailureReasonId);
                        if(!nestFailureReasonId) {
                            validationResultMap[`activities.${activityIndex}.nest_failure_reason_id`] = {
                                name: 'nest_failure_reason_id',
                                resultType: ResultType.Error,
                                message: 'If the status is Failed then the nest failure reason must be supplied',
                            };
                        }
                    }
                }
            }
        }

        return validationResultMap;
    }


    onAfterSave(entity: any, metaEntity: MetaEntity) {
    }
}