import { Injectable } from '@nestjs/common';
import {
  S3Client,
  ListObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { FileRepositoryInterface } from './file-repository.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3FileRepository implements FileRepositoryInterface {
  readonly BUCKET_NAME;
  readonly client = new S3Client({});

  constructor(configService: ConfigService) {
    this.BUCKET_NAME = configService.get('META_BUCKET_NAME');
    if (!this.BUCKET_NAME) {
      throw new Error('META_BUCKET_NAME is not defined');
    }
  }

  async listFiles(dir: string): Promise<string[]> {
    if (!dir.endsWith('/')) {
      dir = dir + '/';
    }

    const command = new ListObjectsCommand({
      Bucket: this.BUCKET_NAME,
    });

    const response = await this.client.send(command);

    const results: string[] = [];
    const contents = response.Contents;
    for (const nextObject of contents) {
      const objectKey = nextObject.Key;
      if (objectKey.startsWith(dir)) {
        const filename = objectKey.substring(dir.length);
        if (filename) {
          results.push(filename);
        }
      }
    }

    //console.log(`***** >>>> results: ${JSON.stringify(results)}`);
    return results;
  }

  async readFile(filename: string): Promise<string> {
    const data = await this.client.send(
      new GetObjectCommand({
        Bucket: this.BUCKET_NAME,
        Key: filename,
      }),
    );

    return await this.streamToString(data.Body);
  }

  async writeFile(filename: string, content: string): Promise<void> {
    const response = await this.client.send(
      new PutObjectCommand({
        Bucket: this.BUCKET_NAME,
        Key: filename,
        Body: content,
      }),
    );

    return;
  }

  streamToString = (stream) =>
    new Promise<string>((resolve, reject) => {
      const chunks = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });

  async deleteFile(filename: string): Promise<void> {
    return await this.client
      .send(
        new DeleteObjectCommand({
          Bucket: this.BUCKET_NAME,
          Key: filename,
        }),
      )
      .then(() => {
        return;
      });
  }
}
