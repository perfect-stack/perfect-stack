import {Module} from "@nestjs/common";
import {MigrateController} from "./migrate.controller";
import {ConfigModule} from "@nestjs/config";
import {MigrateService} from "./migrate.service";
import {MetaEntityModule} from "../meta/meta-entity/meta-entity.module";


@Module({
    imports: [ConfigModule, MetaEntityModule],
    controllers: [MigrateController],
    providers: [MigrateService],
    exports: [MigrateService]
})
export class MigrateModule {

}