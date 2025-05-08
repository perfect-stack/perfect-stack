import {ApiTags} from "@nestjs/swagger";
import {Controller, Get, Param, Post} from "@nestjs/common";
import {MigrateService} from "./migrate.service";
import {ActionPermit} from "../authentication/action-permit";
import {ActionType} from "../domain/meta.role";
import {SubjectName} from "../authentication/subject";


@ApiTags('migrate')
@Controller('migrate')
export class MigrateController {


    public constructor(protected readonly migrateService: MigrateService) {}


    @ActionPermit(ActionType.Edit)
    @SubjectName('Migrate')
    @Post('/data')
    async migrateData() {
        return this.migrateService.migrateData();
    }
}