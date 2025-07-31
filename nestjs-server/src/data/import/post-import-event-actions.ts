import {PostImportActions} from "./data-import.service";
import {Entity} from "../../domain/entity";
import {Injectable} from "@nestjs/common";
import {QueryService} from "../query.service";
import {DataService} from "../data.service";

@Injectable()
export class PostImportEventActions implements PostImportActions {

    constructor(protected readonly queryService: QueryService,
                protected readonly dataService: DataService) {}

    async postImport(entity: Entity): Promise<void> {
        console.log('POST IMPORT....');

        // If the Event has a "status" of "Dead" then we need to load up the Bird and also change its status to Dead
        const status = entity['status'];
        if(status === 'Dead') {
            const bird_id = entity['bird_id'];
            const bird = await this.queryService.findOne('Bird', bird_id);
            if(bird['status'] !== 'Dead') {
                bird['status'] = 'Dead';
                await this.dataService.save('Bird', bird);
            }
        }
    }
}