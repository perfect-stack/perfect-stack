import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityResponse } from '../../domain/response/entity.response';
import { MetaPage } from '../../domain/meta.page';
import { FileRepositoryService } from '../../file/file-repository.service';
import { MetaEditControlValue } from '../meta-edit/meta-edit-control-value';
import { isMetaCacheEnabledFor } from '../meta-edit/meta-edit-utils';

@Injectable()
export class MetaPageService {
  static readonly META_PAGE_DIR = 'page';

  private cacheMap: Map<string, MetaPage> | null = null;
  private cacheLoadPromise: Promise<Map<string, MetaPage>> | null = null;

  constructor(
    protected readonly fileRepositoryService: FileRepositoryService,
    protected readonly configService: ConfigService,
  ) {}

  cacheReset(): void {
    this.cacheMap = null;
    this.cacheLoadPromise = null;
  }

  private isCacheEnabled(): boolean {
    return isMetaCacheEnabledFor(this.configService, MetaEditControlValue.Page);
  }

  private async loadAllIntoMap(): Promise<Map<string, MetaPage>> {
    const resultMap = new Map<string, MetaPage>();
    const fileNames = await this.fileRepositoryService.listFiles(
      MetaPageService.META_PAGE_DIR,
    );

    if (fileNames && fileNames.length > 0) {
      const metaPages = await Promise.all(
        fileNames.map((nextName) =>
          this.readMetaPageFromFile(this.toMetaName(nextName)),
        ),
      );
      for (const metaPage of metaPages) {
        resultMap.set(metaPage.name, metaPage);
      }
    }
    return resultMap;
  }

  async findAllMap(): Promise<Map<string, MetaPage>> {
    if (!this.isCacheEnabled()) {
      return this.loadAllIntoMap();
    }

    if (this.cacheMap) {
      return this.cacheMap;
    }

    if (!this.cacheLoadPromise) {
      const loadPromise = this.loadAllIntoMap()
        .then((map) => {
          if (this.cacheLoadPromise === loadPromise) {
            this.cacheMap = map;
            this.cacheLoadPromise = null;
          }
          return map;
        })
        .catch((err) => {
          if (this.cacheLoadPromise === loadPromise) {
            this.cacheLoadPromise = null;
          }
          throw err;
        });
      this.cacheLoadPromise = loadPromise;
    }

    return this.cacheLoadPromise;
  }

  async findAll(): Promise<MetaPage[]> {
    const metaPageMap = await this.findAllMap();
    return Array.from(metaPageMap.values());
  }

  private async readMetaPageFromFile(metaPageName: string): Promise<MetaPage> {
    const metaPageFromFile = JSON.parse(
      await this.fileRepositoryService.readFile(
        this.toMetaFileName(metaPageName),
      ),
    );

    return Object.assign(new MetaPage(), metaPageFromFile);
  }

  async findOne(metaPageName: string): Promise<MetaPage> {
    if (this.isCacheEnabled()) {
      const metaPageMap = await this.findAllMap();
      const metaPage = metaPageMap.get(metaPageName);
      if (!metaPage) {
        throw new Error(`Unable to find MetaPage ${metaPageName}`);
      }
      return metaPage;
    }

    return this.readMetaPageFromFile(metaPageName);
  }

  async create(metaPage: MetaPage): Promise<void> {
    await this.fileRepositoryService.writeFile(
      this.toMetaFileName(metaPage.name),
      JSON.stringify(metaPage, null, 2),
    );
    this.cacheReset();

    return;
  }

  async update(metaPage: MetaPage): Promise<EntityResponse> {
    await this.fileRepositoryService.writeFile(
      this.toMetaFileName(metaPage.name),
      JSON.stringify(metaPage, null, 2),
    );
    this.cacheReset();
    return;
  }

  async delete(metaPageName: string): Promise<void> {
    await this.fileRepositoryService.deleteFile(
      this.toMetaFileName(metaPageName),
    );
    this.cacheReset();
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
