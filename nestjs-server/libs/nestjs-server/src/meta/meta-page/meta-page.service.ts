import { Injectable } from '@nestjs/common';
import { EntityResponse } from '../../domain/response/entity.response';
import { MetaPage } from '../../domain/meta.page';
import { FileRepositoryService } from '../../file/file-repository.service';

@Injectable()
export class MetaPageService {
  static readonly META_PAGE_DIR = 'meta/page';

  constructor(
    protected readonly fileRepositoryService: FileRepositoryService,
  ) {}

  async findAll(): Promise<MetaPage[]> {
    const resultList: MetaPage[] = [];
    const fileNames = await this.fileRepositoryService.listFiles(
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
    const metaPageFromFile = JSON.parse(
      await this.fileRepositoryService.readFile(
        this.toMetaFileName(metaPageName),
      ),
    );

    return Object.assign(new MetaPage(), metaPageFromFile);
  }

  async create(metaPage: MetaPage): Promise<void> {
    await this.fileRepositoryService.writeFile(
      this.toMetaFileName(metaPage.name),
      JSON.stringify(metaPage, null, 2),
    );

    return;
  }

  async update(metaPage: MetaPage): Promise<EntityResponse> {
    await this.fileRepositoryService.writeFile(
      this.toMetaFileName(metaPage.name),
      JSON.stringify(metaPage, null, 2),
    );
    return;
  }

  async delete(metaPageName: string): Promise<void> {
    return this.fileRepositoryService.deleteFile(
      this.toMetaFileName(metaPageName),
    );
  }

  toMetaName(filename: string) {
    if (filename.endsWith('.json')) {
      return filename.substring(0, filename.indexOf('.json'));
    } else {
      throw new Error(`File name of "${filename}" does not end with .json`);
    }
  }

  toMetaFileName(metaPageName: string) {
    return MetaPageService.META_PAGE_DIR + '/' + metaPageName + '.json';
  }
}
