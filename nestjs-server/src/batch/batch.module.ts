import {Module} from "@nestjs/common";
import {BatchController} from "@app/batch/batch.controller";
import {BatchService} from "@app/batch/batch.service";


@Module({
    controllers: [BatchController],
    providers: [BatchService],
    exports: [BatchService]
})
export class BatchModule {}