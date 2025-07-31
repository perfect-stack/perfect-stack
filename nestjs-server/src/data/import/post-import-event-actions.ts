import {PostImportActions} from "./data-import.service";
import {Entity} from "../../domain/entity";
import {Injectable} from "@nestjs/common";


@Injectable()
export class PostImportEventActions implements PostImportActions {

    async postImport(entity: Entity): Promise<void> {
        console.log('POST IMPORT....');
    }
}