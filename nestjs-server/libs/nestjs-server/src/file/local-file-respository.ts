import { Injectable } from '@nestjs/common';
import { FileRepositoryInterface } from './file-repository.interface';

import * as fs from 'fs';

@Injectable()
export class LocalFileRepository implements FileRepositoryInterface {

  private baseDir: string;

  setBaseDir(dir: string) {
      this.baseDir = dir;
  }

  protected withBaseDir(filePath: string) {
      return this.baseDir + '/' + filePath;
  }

  async listFiles(dir: string): Promise<string[]> {
    dir = this.withBaseDir(dir);

    if (fs.existsSync(dir)) {
      return fs.readdirSync(dir);
    } else {
      throw new Error(`Unable to find dir ${dir}`);
    }
  }

  async readFile(filename: string): Promise<string> {
    filename = this.withBaseDir(filename);

    if (fs.existsSync(filename)) {
      return fs.readFileSync(filename, 'utf8');
    } else {
      throw new Error(`Unable to read file ${filename}`);
    }
  }

  async writeFile(filename: string, content: string): Promise<void> {
    filename = this.withBaseDir(filename);

    return fs.writeFileSync(filename, content);
  }

  async deleteFile(filename: string): Promise<void> {
    filename = this.withBaseDir(filename);

    return fs.unlinkSync(filename);
  }
}
