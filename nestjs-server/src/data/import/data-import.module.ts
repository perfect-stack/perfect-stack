import {Module} from "@nestjs/common";
import {DataImportController} from "./data-import.controller";
import {DataImportService} from "./data-import.service";
import {DataModule} from "../data.module";
import {MetaEntityModule} from "../../meta/meta-entity/meta-entity.module";
import {DuplicateEventCheck} from "./duplicate-event-check";


@Module({
    controllers: [DataImportController],
    imports: [DataModule, MetaEntityModule],
    providers: [DataImportService, DuplicateEventCheck],
    exports: [DataImportService],
})
export class DataImportModule {}
