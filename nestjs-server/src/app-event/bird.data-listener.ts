import {DataEventListener} from "../event/event.service";
import {MetaEntity} from "../domain/meta.entity";
import {ValidationResultMap} from "../domain/meta.rule";
import * as console from "node:console";


export class BirdDataListener implements DataEventListener {

    async onBeforeSave(entity: any, metaEntity: MetaEntity, metaEntityMap: Map<string, MetaEntity>): Promise<ValidationResultMap> {
        return Promise.resolve(undefined);
    }


    async onAfterSave(entity: any, metaEntity: any) {
        if (entity['media_files']) {
            const mediaFiles = entity['media_files'];
            console.log('mediaFiles:', mediaFiles);
        }
        return;
    }
}
