import { FileRepository } from './file-repository.types';
import { Injectable } from '@nestjs/common';
import {
  S3Client,
  ListObjectsCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';

@Injectable()
export class S3FileRepository implements FileRepository {
  client = new S3Client({});

  async listFiles(dir: string): Promise<string[]> {
    if (!dir.endsWith('/')) {
      dir = dir + '/';
    }

    const command = new ListObjectsCommand({
      Bucket: 'perfect-stack-demo-meta',
    });

    const response = await this.client.send(command);

    const results: string[] = [];
    const contents = response.Contents;
    for (const nextObject of contents) {
      const objectKey = nextObject.Key;
      console.log(`objectKey = ${objectKey}`);
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
        Bucket: 'perfect-stack-demo-meta',
        Key: filename,
      }),
    );

    return await this.streamToString(data.Body);
  }

  writeFile(filename: string, content: string): Promise<void> {
    return Promise.resolve(undefined);
  }

  streamToString = (stream) =>
    new Promise<string>((resolve, reject) => {
      const chunks = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
}
