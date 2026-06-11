import {
    Controller,
    Delete, FileTypeValidator,
    Get, MaxFileSizeValidator,
    Param, ParseFilePipe,
    Patch,
    Post,
    Put,
    Res,
    UploadedFile,
    UseInterceptors
} from "@nestjs/common";
import {MediaRepositoryService} from "./media-repository.service";
import {Response} from "express";
import {ApiBody, ApiConsumes, ApiResponse, ApiTags} from "@nestjs/swagger";
import {ActionPermit} from "../authentication/action-permit";
import {ActionType} from "../domain/meta.role";
import {SubjectName} from "../authentication/subject";
import {FileInterceptor} from "@nestjs/platform-express";
import {diskStorage} from "multer";
import {CreateFileResponse} from "./create-file-response";
import {UploadFileResponse} from "./upload-file-response";


const convertUrl = (req, file, callback) => {
    const prefix = '/media/upload';
    if(req.path.startsWith(prefix)) {
        const pathWithoutPrefix = req.path.substring(prefix.length);
        callback(null, pathWithoutPrefix);
    }
    else {
        throw new Error(`Invalid path: ${req.path}`);
    }
}

const storageOptions = diskStorage({
    destination: '/tmp/media', // IMPORTANT: Create this directory or choose another existing one
    filename: convertUrl,
});



@ApiTags('media')
@Controller('media')
export class MediaController {

    constructor(protected mediaRepositoryService: MediaRepositoryService) {}

    @ActionPermit(ActionType.Read)
    @SubjectName('Media')
    @ApiResponse({
        status: 200,
        description: 'File location URL',
        type: String,
    })
    @Get('/locate/*filePath')
    async locateFile(@Param('filePath') filePathArray: string[]): Promise<string> {
        const filePath = filePathArray.join('/');
        console.log('locateFile: filePath', filePath);
        return this.mediaRepositoryService.locateFile(filePath);
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
        const filePath = filePathArray.join('/');
        const fileBufferOrUrl  = await this.mediaRepositoryService.downloadFile(filePath);
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
        console.log('createFile: rawFilename', rawFilename);
        return this.mediaRepositoryService.createFile(rawFilename);
    }

    @ActionPermit(ActionType.Edit)
    @SubjectName('Media')
    @ApiResponse({
        status: 201,
        description: 'File uploaded successfully',
        type: UploadFileResponse,
    })
    @Put('/upload')
    @UseInterceptors(FileInterceptor('file', {storage: storageOptions}))
    @ApiConsumes('multipart/form-data') // Document that this endpoint consumes multipart/form-data
    @ApiBody({ // Document the expected body structure
        schema: {
            type: 'object',
            properties: {
                file: { // Matches the field name in FileInterceptor
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    async uploadFile(@UploadedFile(
        new ParseFilePipe(
            {validators: [
                new MaxFileSizeValidator({maxSize: 10 * 1024 * 1024}),
                new FileTypeValidator({fileType: '.(png|jpeg|jpg|gif)'})
                ], fileIsRequired: true}
        )
    ) file: Express.Multer.File): Promise<UploadFileResponse> {

        // The interceptor takes care of creating the file on the server and then just gives us
        // the "File" handle to that file.
        if(file) {
            console.log('File uploaded successfully:', file);
            console.log('Saved to path:', file.path); // Path where multer saved the file
            console.log('Original filename:', file.originalname);
            console.log('Mimetype:', file.mimetype);
            console.log('Size:', file.size);
            return {
                path: `${file.filename}`
            };
        }
        throw new Error("Unable to upload file")
    }

    @ActionPermit(ActionType.Edit)
    @SubjectName('Media')
    @ApiResponse({
        status: 200,
        description: 'File committed',
        type: String,
    })
    @Patch(':filePath')
    async commitFile(@Param('filePath') filePath: string): Promise<string> {
        return this.mediaRepositoryService.commitFile(filePath);
    }

    @ActionPermit(ActionType.Delete)
    @SubjectName('Media')
    @ApiResponse({
        status: 200,
        description: 'File deleted',
    })
    @Delete(':filePath')
    async deleteFile(@Param('filePath') filePath: string): Promise<void> {
        return this.mediaRepositoryService.deleteFile(filePath);
    }

}