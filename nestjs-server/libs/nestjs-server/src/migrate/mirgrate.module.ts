import {Module} from "@nestjs/common";
import {MigrateController} from "./migrate.controller";
import {ConfigModule} from "@nestjs/config";
import {MigrateService} from "./migrate.service";
import {MetaEntityModule} from "../meta/meta-entity/meta-entity.module";
import {MigrateImagesService} from "./migrate-images.service";
import {DataModule} from "../data/data.module";
import {MediaRepositoryModule} from "../media/media-repository.module";


@Module({
    imports: [ConfigModule, DataModule, MediaRepositoryModule, MetaEntityModule],
    controllers: [MigrateController],
    providers: [MigrateService, MigrateImagesService],
    exports: [MigrateService, MigrateImagesService]
})
export class MigrateModule {

}