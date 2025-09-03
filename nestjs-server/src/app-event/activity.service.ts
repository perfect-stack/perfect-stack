import {Injectable} from "@nestjs/common";
import {DiscriminatorMapping, DiscriminatorService} from "@app/data/discriminator.service";
import {MetaEntityService} from "@app/meta/meta-entity/meta-entity.service";


@Injectable()
export class ActivityService {

    private _discriminatorMap: Map<string, DiscriminatorMapping>;

    constructor(
        protected readonly metaEntityService: MetaEntityService,
        protected readonly discriminatorService: DiscriminatorService,
    ) {}

    private async getDiscriminatorMap() {
        if(!this._discriminatorMap) {
            const eventMetaEntity = await this.metaEntityService.findOne("Event");
            console.log('eventMetaEntity:', eventMetaEntity);
            let activitiesAttribute = eventMetaEntity.attributes.find(s => s.name === 'activities');
            console.log(`activitiesAttribute: ${activitiesAttribute}`)
            this._discriminatorMap = await this.discriminatorService.findDiscriminatorMap(activitiesAttribute);
        }
        return this._discriminatorMap;
    }

    public async findActivityIndex(
        activityList: any[],
        activity_type: string,
    ): Promise<number | null> {
        if (activityList) {
            const discriminatorMap = await this.getDiscriminatorMap();
            const activityType = discriminatorMap.get(activity_type);
            if(activityType) {
                return activityList.findIndex((s: any) => s.activity_type_id === activityType.discriminatorId);
            }
            else {
                throw new Error(`Unable to find discriminator for ${activity_type}`);
            }
        } else {
            return null;
        }
    }

    public async findActivity(
        eventEntity: any,
        activity_type: string,
    ): Promise<any | null> {
        const activities = eventEntity.activities;
        if(activities && activities.length > 0) {
            const activitiyIdx = await this.findActivityIndex(activities, activity_type);
            if(activitiyIdx >= 0) {
                return activities[activitiyIdx];
            }
        }
        return null;
    }
}