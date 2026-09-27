import {
    Controller,
    Delete,
    Get,
    Logger,
    Param,
    Patch,
    Post,
    Put,
    Req,
    Res,
} from "@nestjs/common";
import {MediaRepositoryService} from "./media-repository.service";
import {Request, Response} from "express";
import {ApiResponse, ApiTags} from "@nestjs/swagger";
import {ActionPermit} from "../authentication/action-permit";
import {ActionType} from "../domain/meta.role";
import {SubjectName} from "../authentication/subject";
import {CreateFileResponse} from "./create-file-response";
import {UploadFileResponse} from "./upload-file-response";
import {MediaUtils} from "./media-utils";

@ApiTags('media')
@Controller('media')
export class MediaController {
    private readonly logger = new Logger(MediaController.name);

    constructor(
        protected mediaRepositoryService: MediaRepositoryService,
        protected mediaUtils: MediaUtils,
    ) {}

    @ActionPermit(ActionType.Read)
    @SubjectName('Media')
    @ApiResponse({
        status: 200,
        description: 'File location URL',
        type: String,
    })
    @Get('/locate/*filePath')
    async locateFile(@Param('filePath') filePathArray: string[]): Promise<string> {
        const filePath = Array.isArray(filePathArray) ? filePathArray.join('/') : filePathArray;
        this.logger.log(`locateFile: filePath = ${filePath}`);
        const result = await this.mediaRepositoryService.locateFile(filePath);
        this.logger.log(`locateFile result for ${filePath} = ${result}`);
        return result;
    }

    @ActionPermit(ActionType.Read)
    @SubjectName('Media')
    @ApiResponse({
        status: 200,
        description: 'File downloaded',
        schema: {
            type: 'string',
            format: 'binary'
        }
    })
    @Get('/download/*filePath')
    async downloadFile(@Param('filePath') filePathArray: string[], @Res() res: Response): Promise<void> {
        const filePath = Array.isArray(filePathArray) ? filePathArray.join('/') : filePathArray;
        this.logger.log(`downloadFile: filePath = ${filePath}`);
        const fileBufferOrUrl = await this.mediaRepositoryService.downloadFile(filePath);
        try {
            const contentType = this.mediaUtils.toContentType(filePath);
            if (contentType) {
                res.setHeader('Content-Type', contentType);
            }
        } catch {
            // Ignore if content-type cannot be resolved
        }
        res.send(fileBufferOrUrl);
    }

    @ActionPermit(ActionType.Edit)
    @SubjectName('Media')
    @ApiResponse({
        status: 201,
        description: 'File created successfully',
        type: CreateFileResponse,
    })
    @Post('/create/:filename')
    async createFile(@Param('filename') rawFilename: string): Promise<CreateFileResponse> {
        this.logger.log(`createFile: rawFilename = ${rawFilename}`);
        const response = await this.mediaRepositoryService.createFile(rawFilename);
        this.logger.log(`createFile response: ${JSON.stringify(response)}`);
        return response;
    }

    @ActionPermit(ActionType.Edit)
    @SubjectName('Media')
    @ApiResponse({
        status: 201,
        description: 'File uploaded successfully',
        type: UploadFileResponse,
    })
    @Put('/upload/*filePath')
    async uploadFile(
        @Param('filePath') filePathArray: string[],
        @Req() req: Request,
    ): Promise<UploadFileResponse> {
        const filePath = Array.isArray(filePathArray) ? filePathArray.join('/') : filePathArray;
        this.logger.log(`uploadFile start: filePath = ${filePath}, content-type = ${req.headers['content-type']}, content-length = ${req.headers['content-length']}`);
        await this.mediaRepositoryService.uploadFile(filePath, req);
        this.logger.log(`uploadFile completed successfully: filePath = ${filePath}`);
        return {
            path: filePath
        };
    }

    @ActionPermit(ActionType.Edit)
    @SubjectName('Media')
    @ApiResponse({
        status: 200,
        description: 'File committed',
        type: String,
    })
    @Patch('/*filePath')
    async commitFile(@Param('filePath') filePathArray: string[] | string): Promise<string> {
        const filePath = Array.isArray(filePathArray) ? filePathArray.join('/') : filePathArray;
        this.logger.log(`commitFile: filePath = ${filePath}`);
        const result = await this.mediaRepositoryService.commitFile(filePath);
        this.logger.log(`commitFile result for ${filePath} = ${result}`);
        return result;
    }

    @ActionPermit(ActionType.Delete)
    @SubjectName('Media')
    @ApiResponse({
        status: 200,
        description: 'File deleted',
    })
    @Delete('/*filePath')
    async deleteFile(@Param('filePath') filePathArray: string[] | string): Promise<void> {
        const filePath = Array.isArray(filePathArray) ? filePathArray.join('/') : filePathArray;
        this.logger.log(`deleteFile: filePath = ${filePath}`);
        return this.mediaRepositoryService.deleteFile(filePath);
    }

}
