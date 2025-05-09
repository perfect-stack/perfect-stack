import {DataEventListener} from "../event/event.service";
import {MetaEntity} from "../domain/meta.entity";
import {ValidationResultMap} from "../domain/meta.rule";
import {MediaRepositoryService} from "../media/media-repository.service";
import {MediaFile} from "./media-file.interface";


export class BirdDataListener implements DataEventListener {

    constructor(private readonly mediaRepositoryService: MediaRepositoryService) {
    }

    async onBeforeSave(entity: any, metaEntity: MetaEntity, metaEntityMap: Map<string, MetaEntity>): Promise<ValidationResultMap> {
        if (entity['media_files']) {
            const mediaFiles = entity['media_files'] as MediaFile[];
            for(const nextMediaFile of mediaFiles) {
                if(nextMediaFile.path.startsWith('Temp/')) {
                    const newPath = await this.mediaRepositoryService.commitFile(nextMediaFile.path);
                    if (newPath) {
                        console.log(`onBeforeSave() ${nextMediaFile.path} commit file to ${newPath}`);
                        nextMediaFile.path = newPath;
                    }
                }
            }
        }
        return;
    }

    async onAfterSave(entity: any, metaEntity: any) {
    }
}
