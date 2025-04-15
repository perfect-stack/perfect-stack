import {
    Controller,
    Delete, FileTypeValidator,
    Get, MaxFileSizeValidator,
    Param, ParseFilePipe,
    Patch,
    Post,
    Put,
    Req,
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
import { v4 as uuidv4 } from 'uuid';
import {MEDIA_TYPE_MAP, MediaType} from "./media-type";


const toMediaType = (suffix: string): MediaType => {
    if(MEDIA_TYPE_MAP.has(suffix)) {
        return MEDIA_TYPE_MAP.get(suffix);
    }
    else {
        throw new Error(`Unsupported media type: ${suffix}`);
    }
}

const toSuffix = (filename: string): string => {
    if(filename.indexOf('.') > -1) {
        const parts = filename.split('.');
        return parts[parts.length - 1];
    }
    else {
        throw new Error('filename does not contain a suffix')
    }
}

const generateUniqueFilename = (req, file, callback) => {
    const name = file.originalname.split('.')[0];
    const fileSuffix = toSuffix(file.originalname);
    const uniqueName = uuidv4();
    const mediaType = toMediaType(fileSuffix);
    callback(null, `${mediaType}/${uniqueName}.${fileSuffix}`);
};

const storageOptions = diskStorage({
    destination: './media/Temp', // IMPORTANT: Create this directory or choose another existing one
    filename: generateUniqueFilename, // Use the helper function for unique names
});



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
    ) file: Express.Multer.File): Promise<any> {
        //console.log('uploadFile:', req);
        //return this.mediaRepositoryService.uploadFile(null, null);

        if(file) {
            console.log('File uploaded successfully:', file);
            console.log('Saved to path:', file.path); // Path where multer saved the file
            console.log('Original filename:', file.originalname);
            console.log('Mimetype:', file.mimetype);
            console.log('Size:', file.size);
            return {
                path: `/Temp/${file.filename}`
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