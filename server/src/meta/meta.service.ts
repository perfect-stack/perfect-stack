import { Injectable } from '@nestjs/common';
import { MetaEntity } from '../domain/meta.entity';
import { EntityResponse } from '../domain/response/entity.response';
import * as fs from 'fs';

@Injectable()
export class MetaService {
  static readonly META_DIR = 'meta';

  async findAll(): Promise<MetaEntity[]> {
    if (fs.existsSync(MetaService.META_DIR)) {
      const resultList: MetaEntity[] = [];
      const fileNames = fs.readdirSync(MetaService.META_DIR);
      if (fileNames && fileNames.length > 0) {
        for (const nextName of fileNames) {
          const metaEntity = await this.findOne(this.toMetaName(nextName));
          resultList.push(metaEntity);
        }
      }
      return resultList;
    } else {
      throw new Error('Meta directory does not exist');
    }
  }

  async findOne(metaName: string): Promise<MetaEntity> {
    const metaFileName = MetaService.META_DIR + '/' + this.toFileName(metaName);
    if (fs.existsSync(metaFileName)) {
      return JSON.parse(fs.readFileSync(metaFileName, 'utf8'));
    } else {
      throw new Error(`Unable to find file for "${metaFileName}"`);
    }
  }

  create(metaEntity: MetaEntity): Promise<EntityResponse> {
    return;
  }

  update(): Promise<EntityResponse> {
    return;
  }

  archive(): Promise<void> {
    return;
  }

  toMetaName(filename: string) {
    if (filename.endsWith('.json')) {
      return filename.substring(0, filename.indexOf('.json'));
    } else {
      throw new Error(`File name of "${filename}" does not end with .json`);
    }
  }

  toFileName(metaName: string) {
    return metaName + '.json';
  }
}
