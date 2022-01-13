import { Injectable } from '@nestjs/common';
import { EntityResponse } from '../../domain/response/entity.response';
import { MetaPage } from '../../domain/meta.page';
import { LocalFileRepository } from '../../file/local-file-respository';

@Injectable()
export class MetaPageService {
  static readonly META_PAGE_DIR = 'meta/page';

  constructor(protected readonly fileRepository: LocalFileRepository) {}

  async findAll(): Promise<MetaPage[]> {
    const resultList: MetaPage[] = [];
    const fileNames = await this.fileRepository.listFiles(
      MetaPageService.META_PAGE_DIR,
    );

    if (fileNames && fileNames.length > 0) {
      for (const nextName of fileNames) {
        const metaPage = await this.findOne(this.toMetaName(nextName));
        resultList.push(metaPage);
      }
    }
    return resultList;
  }

  async findOne(metaPageName: string): Promise<MetaPage> {
    const metaFileName =
      MetaPageService.META_PAGE_DIR + '/' + this.toFileName(metaPageName);

    const metaPageFromFile = JSON.parse(
      await this.fileRepository.readFile(metaFileName),
    );

    return Object.assign(new MetaPage(), metaPageFromFile);
  }

  async create(metaPage: MetaPage): Promise<void> {
    const metaFileName =
      MetaPageService.META_PAGE_DIR + '/' + this.toFileName(metaPage.name);

    await this.fileRepository.writeFile(
      metaFileName,
      JSON.stringify(metaPage, null, 2),
    );

    return;
  }

  async update(metaPage: MetaPage): Promise<EntityResponse> {
    const metaFileName =
      MetaPageService.META_PAGE_DIR + '/' + this.toFileName(metaPage.name);

    await this.fileRepository.writeFile(
      metaFileName,
      JSON.stringify(metaPage, null, 2),
    );
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
