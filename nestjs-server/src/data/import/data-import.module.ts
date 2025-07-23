import {Module} from "@nestjs/common";
import {DataImportController} from "./data-import.controller";
import {DataImportService} from "./data-import.service";


@Module({
    controllers: [DataImportController],
    imports: [],
    providers: [DataImportService],
    exports: [DataImportService],
})
export class DataImportModule {}
