import {Module} from "@nestjs/common";
import {DataImportController} from "./data-import.controller";
import {DataImportService} from "./data-import.service";
import {DataModule} from "../data.module";


@Module({
    controllers: [DataImportController],
    imports: [DataModule],
    providers: [DataImportService],
    exports: [DataImportService],
})
export class DataImportModule {}
