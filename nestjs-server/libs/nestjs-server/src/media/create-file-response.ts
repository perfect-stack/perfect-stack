import { ApiProperty } from '@nestjs/swagger';

export class CreateFileResponse {
    @ApiProperty({ description: 'The unique identifier or key of the created file', example: 'abc-12345.png' })
    resourceKey: string;

    @ApiProperty({ description: 'The destination URL or presigned URL for the file', example: 'https://s3.amazonaws.com/...' })
    resourceUrl: string;
}