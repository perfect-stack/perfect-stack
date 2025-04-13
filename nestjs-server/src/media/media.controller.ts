import {Controller, Get, Param, Patch, Post, Res} from "@nestjs/common";
import {MediaRepositoryService} from "./media-repository.service";
import {Response} from "express";
import {ApiTags} from "@nestjs/swagger";
import {ActionPermit} from "../authentication/action-permit";
import {ActionType} from "../domain/meta.role";
import {PublicApi} from "../authentication/public-api";
import {SubjectName} from "../authentication/subject";

@ApiTags('media')
@Controller('media')
export class MediaController {

    constructor(
        protected mediaRepositoryService: MediaRepositoryService
    ) {
    }

    @ActionPermit(ActionType.Read)
    @SubjectName('Media')
    @Get('*')
    async getMedia(@Param('0') filePath: string, @Res() res: Response) {
        console.log('getMedia: ', filePath);
        const file = await this.mediaRepositoryService.downloadFile(filePath);
        res.send(file);
    }

    @ActionPermit(ActionType.Edit)
    @SubjectName('Media')
    @Post(':filename')
    async createFile(filename: string): Promise<string> {
        return this.mediaRepositoryService.createFile(filename);
    }

    @ActionPermit(ActionType.Edit)
    @SubjectName('Media')
    @Patch(':filePath')
    async commitFile(filePath: string): Promise<void> {
        return this.mediaRepositoryService.commitFile(filePath);
    }

    @ActionPermit(ActionType.Delete)
    @SubjectName('Media')
    @Post(':filePath')
    async deleteFile(filePath: string): Promise<void> {
        return this.mediaRepositoryService.deleteFile(filePath);
    }

    @ActionPermit(ActionType.Edit)
    @SubjectName('Media')
    @Post(':filePath')
    async uploadFile(filePath: string, content: string): Promise<void> {
        return this.mediaRepositoryService.uploadFile(filePath, content);
    }
}