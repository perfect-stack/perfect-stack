import {ApiBody, ApiConsumes, ApiTags} from "@nestjs/swagger";
import {
    Body,
    Controller,
    MaxFileSizeValidator,
    ParseFilePipe,
    Post,
    UploadedFile,
    UseInterceptors
} from "@nestjs/common";
import {ActionPermit} from "../../authentication/action-permit";
import {ActionType} from "../../domain/meta.role";
import {SubjectName} from "../../authentication/subject";
import {FileInterceptor} from "@nestjs/platform-express";
import {diskStorage} from "multer";
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import {DataImportService} from "./data-import.service";
import {DataImportModel, DataImportResult} from "./data-import.model";


// Define the upload destination as a constant for clarity and reuse.
const UPLOAD_DESTINATION = './data-import/upload';

// --- Corrected and Improved Storage Options ---
const storageOptions = diskStorage({
    // Use a function for destination to ensure the directory exists.
    destination: (req, file, callback) => {
        // This will create the directory if it doesn't exist.
        fs.mkdirSync(UPLOAD_DESTINATION, { recursive: true });
        callback(null, UPLOAD_DESTINATION);
    },

    filename: (req, file, callback) => {
        // Generate a unique filename to prevent overwrites and conflicts.
        const uniqueSuffix = uuidv4();
        const extension = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, extension);

        // Sanitize the base name to remove problematic characters.
        const safeBaseName = baseName.replace(/[^a-z0-9_.-]/gi, '_').toLowerCase();

        callback(null, `${safeBaseName}-${uniqueSuffix}${extension}`);
    },
});


@ApiTags('data-import')
@Controller('data-import')
export class DataImportController {


    constructor(protected readonly dataImportService: DataImportService) {
    }

    @ActionPermit(ActionType.Edit)
    @SubjectName('Media')
    @Post('/upload')
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
                new MaxFileSizeValidator({maxSize: 10 * 1024 * 1024})
            ], fileIsRequired: true}
        )
    ) file: Express.Multer.File): Promise<DataImportModel> {

        // The interceptor takes care of creating the file on the server and then just gives us
        // the "File" handle to that file.
        if(file) {
            console.log('File uploaded successfully:', file);
            console.log('Saved to path:', file.path); // Path where multer saved the file
            console.log('Original filename:', file.originalname);
            console.log('Mimetype:', file.mimetype);
            console.log('Size:', file.size);
            return this.dataImportService.parseFile(file.path);
        }
        throw new Error("Unable to upload file")
    }

    @ActionPermit(ActionType.Edit)
    @SubjectName('Media')
    @Post('/data')
    async importData(@Body() dataImportModel: DataImportModel): Promise<DataImportResult> {
        if(dataImportModel.errors.length === 0) {
            return this.dataImportService.processAndSave(dataImportModel);
        }
    }

}