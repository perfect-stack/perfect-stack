import { Injectable } from '@nestjs/common';
import { EntityResponse } from '../../domain/response/entity.response';
import { MetaPage } from '../../domain/meta.page';

import * as fs from 'fs';

@Injectable()
export class MetaPageService {
  static readonly META_PAGE_DIR = 'meta/page';

  async findAll(): Promise<MetaPage[]> {
    if (fs.existsSync(MetaPageService.META_PAGE_DIR)) {
      const resultList: MetaPage[] = [];
      const fileNames = fs.readdirSync(MetaPageService.META_PAGE_DIR);
      if (fileNames && fileNames.length > 0) {
        for (const nextName of fileNames) {
          const metaPage = await this.findOne(this.toMetaName(nextName));
          resultList.push(metaPage);
        }
      }
      return resultList;
    } else {
      throw new Error(
        `Meta directory ${MetaPageService.META_PAGE_DIR} does not exist`,
      );
    }
  }

  async findOne(metaPageName: string): Promise<MetaPage> {
    const metaFileName =
      MetaPageService.META_PAGE_DIR + '/' + this.toFileName(metaPageName);
    if (fs.existsSync(metaFileName)) {
      const metaPageFromFile = JSON.parse(
        fs.readFileSync(metaFileName, 'utf8'),
      );
      const metaPage: MetaPage = Object.assign(
        new MetaPage(),
        metaPageFromFile,
      );
      return metaPage;
    } else {
      throw new Error(`Unable to find file for "${metaFileName}"`);
    }
  }

  create(metaPage: MetaPage): Promise<any> {
    const metaFileName =
      MetaPageService.META_PAGE_DIR + '/' + this.toFileName(metaPage.name);
    if (!fs.existsSync(metaFileName)) {
      fs.writeFileSync(metaFileName, JSON.stringify(metaPage, null, 2));
    } else {
      throw new Error(
        `Create meta page failed, file exists already; ${metaFileName}`,
      );
    }

    return;
  }

  update(metaPage: MetaPage): Promise<EntityResponse> {
    const metaFileName =
      MetaPageService.META_PAGE_DIR + '/' + this.toFileName(metaPage.name);
    if (fs.existsSync(metaFileName)) {
      fs.writeFileSync(metaFileName, JSON.stringify(metaPage, null, 2));
    } else {
      throw new Error(
        `Update meta page failed, file does not exist; ${metaFileName}`,
      );
    }
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

  toFileName(metaPageName: string) {
    return metaPageName + '.json';
  }
}
