import {Module} from "@nestjs/common";
import {DataImportController} from "./data-import.controller";
import {DataImportService} from "./data-import.service";
import {DataModule} from "../data.module";
import {MetaEntityModule} from "../../meta/meta-entity/meta-entity.module";


@Module({
    controllers: [DataImportController],
    imports: [DataModule, MetaEntityModule],
    providers: [DataImportService],
    exports: [DataImportService],
})
export class DataImportModule {}
