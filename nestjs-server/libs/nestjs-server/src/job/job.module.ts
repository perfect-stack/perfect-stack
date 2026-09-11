import {Module} from "@nestjs/common";
import {JobController} from "./job.controller";
import {DataModule} from "../data/data.module";
import {MetaEntityModule} from "../meta/meta-entity/meta-entity.module";
import {JobService} from "./job.service";

@Module({
    controllers: [JobController],
    imports: [DataModule, MetaEntityModule],
    providers: [JobService],
    exports: [JobService]
})
export class JobModule {}
