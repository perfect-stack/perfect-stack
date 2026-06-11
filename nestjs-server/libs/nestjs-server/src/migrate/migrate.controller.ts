import {ApiResponse, ApiTags} from "@nestjs/swagger";
import {Controller, Get, Param, Post} from "@nestjs/common";
import {MigrateService} from "./migrate.service";
import {ActionPermit} from "../authentication/action-permit";
import {ActionType} from "../domain/meta.role";
import {SubjectName} from "../authentication/subject";
import {MigrateImagesService} from "./migrate-images.service";


@ApiTags('migrate')
@Controller('migrate')
export class MigrateController {


    public constructor(
        protected readonly migrateService: MigrateService,
        protected readonly migrateImagesService: MigrateImagesService
    ) {}


    @ActionPermit(ActionType.Edit)
    @SubjectName('Migrate')
    @ApiResponse({
        status: 201,
        description: 'Data migration started',
        type: Object,
    })
    @Post('/data')
    async migrateData() {
        return this.migrateService.migrateData();
    }

    @ActionPermit(ActionType.Edit)
    @SubjectName('Migrate')
    @ApiResponse({
        status: 201,
        description: 'Image migration started',
        type: Object,
    })
    @Post('/images')
    async migrateImages() {
        return this.migrateImagesService.migrateImages();
    }

    @ActionPermit(ActionType.Edit)
    @SubjectName('Migrate')
    @ApiResponse({
        status: 201,
        description: 'Image migration reset',
        type: Object,
    })
    @Post('/images/reset')
    async migrateImagesReset() {
        return this.migrateImagesService.migrateImagesReset();
    }
}