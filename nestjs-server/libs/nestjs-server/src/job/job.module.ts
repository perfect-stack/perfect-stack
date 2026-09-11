import {Module} from "@nestjs/common";
import {JobController} from "./job.controller";
import {DataModule} from "../data/data.module";
import {MetaEntityModule} from "../meta/meta-entity/meta-entity.module";
import {JobService} from "./job.service";
import {OrmModule} from "../orm/orm.module";

@Module({
    controllers: [JobController],
    imports: [DataModule, MetaEntityModule, OrmModule],
    providers: [JobService],
    exports: [JobService]
})
export class JobModule {}
