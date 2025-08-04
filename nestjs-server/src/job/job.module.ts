import {Module} from "@nestjs/common";
import {JobController} from "./job.controller";
import {DataModule} from "../data/data.module";
import {MetaEntityModule} from "../meta/meta-entity/meta-entity.module";
import {JobService} from "./job.service";
import {DataImportJobController} from "./data-import-job.controller";


@Module({
    controllers: [DataImportJobController, JobController],
    imports: [DataModule, MetaEntityModule],
    providers: [JobService],
    exports: [JobService]
})
export class JobModule {}