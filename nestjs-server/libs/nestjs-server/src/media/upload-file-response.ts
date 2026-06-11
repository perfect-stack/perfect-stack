import { ApiProperty } from '@nestjs/swagger';

export class UploadFileResponse {
    @ApiProperty({ description: 'The path of the uploaded file' })
    path: string;
}