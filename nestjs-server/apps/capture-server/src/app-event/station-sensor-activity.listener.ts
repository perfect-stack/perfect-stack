import { Injectable, Logger } from "@nestjs/common";
import { DataService } from "@perfect-stack/nestjs-server/data/data.service";
import { DataEventListener } from "@perfect-stack/nestjs-server/event/event.service";
import { QueryService } from "@perfect-stack/nestjs-server";
import { MetaEntity } from "@perfect-stack/nestjs-server/domain/meta.entity";
import {StationSensorActivityService} from "../activity/station-sensor-activity.service";


@Injectable()
export class StationSensorActivityListener implements DataEventListener {

    private readonly logger = new Logger(StationSensorActivityListener.name);

    constructor(
        private dataService: DataService,
        private queryService: QueryService,
        private stationSensorActivityService: StationSensorActivityService
    ) {
    }

    onBeforeSave(eventData: any): Promise<any> {
        return;
    }

    hasCustomSave(): boolean {
        return true;
    }

    onCustomSave(entity: any, metaEntity: MetaEntity) {
        return this.stationSensorActivityService.save(entity);
    }

    onAfterSave(eventData: any): Promise<any> {
        return;
    }

}
