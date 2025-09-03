import {MediaFile} from "./media-file.interface";
import {DataEventListener} from "@perfect-stack/nestjs-server/event/event.service";
import {MediaRepositoryService} from "@perfect-stack/nestjs-server/media/media-repository.service";
import {MetaEntity} from "@perfect-stack/nestjs-server/domain/meta.entity";
import {ValidationResultMap} from "@perfect-stack/nestjs-server/domain/meta.rule";


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
