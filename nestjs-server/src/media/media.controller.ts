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
import {ApiBody, ApiConsumes, ApiTags} from "@nestjs/swagger";
import {ActionPermit} from "../authentication/action-permit";
import {ActionType} from "../domain/meta.role";
import {SubjectName} from "../authentication/subject";
import {FileInterceptor} from "@nestjs/platform-express";
import {diskStorage} from "multer";


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
    destination: './media', // IMPORTANT: Create this directory or choose another existing one
    filename: convertUrl,
});



@ApiTags('media')
@Controller('media')
export class MediaController {

    constructor(protected mediaRepositoryService: MediaRepositoryService) {}

    @ActionPermit(ActionType.Read)
    @SubjectName('Media')
    @Get('/locate/*')
    async locateFile(@Param('0') filePath: string) {
        return this.mediaRepositoryService.locateFile(filePath);
    }

    @ActionPermit(ActionType.Read)
    @SubjectName('Media')
    @Get('*')
    async downloadFile(@Param('0') filePath: string, @Res() res: Response) {
        const fileBufferOrUrl  = await this.mediaRepositoryService.downloadFile(filePath);
        res.send(fileBufferOrUrl);
    }

    @ActionPermit(ActionType.Edit)
    @SubjectName('Media')
    @Post('/create/*')
    async createFile(@Param('0') rawFilename: string): Promise<string> {
        return this.mediaRepositoryService.createFile(rawFilename);
    }

    @ActionPermit(ActionType.Edit)
    @SubjectName('Media')
    @Put('/upload/*')
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
    ) file: Express.Multer.File): Promise<any> {

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
    @Patch(':filePath')
    async commitFile(filePath: string): Promise<string> {
        return this.mediaRepositoryService.commitFile(filePath);
    }

    @ActionPermit(ActionType.Delete)
    @SubjectName('Media')
    @Delete(':filePath')
    async deleteFile(filePath: string): Promise<void> {
        return this.mediaRepositoryService.deleteFile(filePath);
    }

}