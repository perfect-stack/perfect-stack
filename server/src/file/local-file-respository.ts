import { FileRepository } from './file-repository.types';
import { Injectable } from '@nestjs/common';

import * as fs from 'fs';

@Injectable()
export class LocalFileRepository implements FileRepository {
  async listFiles(dir: string): Promise<string[]> {
    if (fs.existsSync(dir)) {
      return fs.readdirSync(dir);
    } else {
      throw new Error(`Unable to find dir ${dir}`);
    }
  }

  async readFile(filename: string): Promise<string> {
    if (fs.existsSync(filename)) {
      return fs.readFileSync(filename, 'utf8');
    } else {
      throw new Error(`Unable to read file ${filename}`);
    }
  }

  async writeFile(filename: string, content: string): Promise<void> {
    return fs.writeFileSync(filename, content);
  }
}
