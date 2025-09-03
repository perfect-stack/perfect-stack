import {DataEventListener} from "@app/event/event.service";
import {ValidationResultMap} from "@app/domain/meta.rule";
import {MetaEntity} from "@app/domain/meta.entity";
import {Logger} from "@nestjs/common";
import {ActivityService} from "@app/app-event/activity.service";
import {DataService} from "@app/data/data.service";
import {QueryService} from "@app/data/query.service";


export class DeathActivityDataListener implements DataEventListener {

    private readonly logger = new Logger(DeathActivityDataListener.name);


    constructor(
        protected readonly activityService: ActivityService,
        protected readonly dataService: DataService,
        protected readonly queryService: QueryService
    ) {}

    onBeforeSave(entity: any, metaEntity: MetaEntity, metaEntityMap: Map<string, MetaEntity>): Promise<ValidationResultMap> {
        return Promise.resolve(undefined);
    }

    async onAfterSave(entity: any, metaEntity: MetaEntity) {
        this.logger.log(`DeathActivityDataListener onAfterSave called for ${metaEntity.name} with id ${entity.id}`)

        const deathActivity = await this.activityService.findActivity(entity, "Death");
        if(deathActivity) {
            this.logger.log(`DeathActivityDataListener found death activity for ${entity.id}`);
            if(entity['status'] != 'Dead') {
                entity['status'] = 'Dead';
                await this.dataService.save('Event', entity);
            }

            const birdEntity = await this.queryService.findOne('Bird', entity.bird_id);
            if(birdEntity && birdEntity['status'] != 'Dead') {
                this.logger.log(`DeathActivityDataListener but bird is not Dead already: ${birdEntity['status']}`);
                birdEntity['status'] = 'Dead';
                await this.dataService.save('Bird', birdEntity);
            }
            else {
                this.logger.log(`DeathActivityDataListener and bird is: ${birdEntity['status']}`);
            }
        }
    }
}