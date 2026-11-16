import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { MetaMenu } from '../../domain/meta.menu';
import { FileRepositoryService } from '../../file/file-repository.service';
import { ConfigService } from '@nestjs/config';
import { OrmService } from '../../orm/orm.service';
import { MetaEditControlValue } from '../meta-edit/meta-edit-control-value';
import { isMetaCacheEnabledFor } from '../meta-edit/meta-edit-utils';

@Injectable()
export class MetaMenuService {
  static readonly META_MENU_DIR = 'menu';

  private cacheMenu: MetaMenu | null = null;
  private cacheLoadPromise: Promise<MetaMenu> | null = null;

  constructor(
    protected readonly configService: ConfigService,
    protected readonly fileRepositoryService: FileRepositoryService,
    protected readonly ormService: OrmService,
  ) { }

  cacheReset(): void {
    this.cacheMenu = null;
    this.cacheLoadPromise = null;
  }

  private isCacheEnabled(): boolean {
    return isMetaCacheEnabledFor(this.configService, MetaEditControlValue.Menu);
  }

  private async readMetaMenuFromFile(): Promise<MetaMenu> {
    const metaFileName = MetaMenuService.META_MENU_DIR + '/MetaMenu.json';
    const metaMenuFromFile = JSON.parse(
      await this.fileRepositoryService.readFile(metaFileName),
    );

    const metaMenu: MetaMenu = Object.assign(new MetaMenu(), metaMenuFromFile);
    return metaMenu;
  }

  async findOne() {
    if (!this.isCacheEnabled()) {
      return this.readMetaMenuFromFile();
    }

    if (this.cacheMenu) {
      return this.cacheMenu;
    }

    if (!this.cacheLoadPromise) {
      const loadPromise = this.readMetaMenuFromFile()
        .then((metaMenu) => {
          if (this.cacheLoadPromise === loadPromise) {
            this.cacheMenu = metaMenu;
            this.cacheLoadPromise = null;
          }
          return metaMenu;
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

  async update(metaMenu: MetaMenu) {
    const metaFileName = MetaMenuService.META_MENU_DIR + '/MetaMenu.json';

    await this.fileRepositoryService.writeFile(
      metaFileName,
      JSON.stringify(metaMenu, null, 2),
    );
    this.cacheReset();

    return;
  }

  getVersion(): any {
    const serverRelease = this.configService.get('SERVER_RELEASE', 'Unknown');
    return {
      serverRelease: serverRelease,
    };
  }

  async getPostGisVersion(): Promise<any> {
    try {
      return await this.ormService.sequelize.query(
        'SELECT postgis_full_version();',
      );
    } catch (e: any) {
      throw new HttpException(
        e.original?.message || e.message || 'Error executing query',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createPostGisExtension(): Promise<any> {
    try {
      return await this.ormService.sequelize.query(
        'CREATE EXTENSION IF NOT EXISTS postgis;',
      );
    } catch (e: any) {
      throw new HttpException(
        e.original?.message || e.message || 'Error executing query',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
