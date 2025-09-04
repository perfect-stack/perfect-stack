import {Module} from "@nestjs/common";
import {DataImportController} from "./data-import.controller";
import {DataImportService} from "./data-import.service";
import {DataModule} from "../data.module";
import {MetaEntityModule} from "../../meta/meta-entity/meta-entity.module";
import {DuplicateEventCheck} from "./duplicate-event-check";
import {PostImportEventActions} from "./post-import-event-actions";
import {DataImportFileService} from "./data-import-file.service";
import {DataFormatService} from "@perfect-stack/nestjs-server/data/import/data-format.service";


@Module({
    controllers: [DataImportController],
    imports: [DataModule, MetaEntityModule],
    providers: [DataImportService, DataImportFileService, DuplicateEventCheck, PostImportEventActions, DataFormatService],
    exports: [DataImportService, DataImportFileService],
})
export class DataImportModule {}
