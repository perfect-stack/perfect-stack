import {Module} from "@nestjs/common";
import {BatchController} from "./batch.controller";
import {BatchService} from "./batch.service";
import {JobModule} from "../job/job.module";

@Module({
    imports: [JobModule],
    controllers: [BatchController],
    providers: [BatchService],
    exports: [BatchService]
})
export class BatchModule {}
