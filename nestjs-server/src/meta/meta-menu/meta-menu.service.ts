import { Injectable } from '@nestjs/common';
import { MetaMenu } from '../../domain/meta.menu';
import { FileRepositoryService } from '../../file/file-repository.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MetaMenuService {
  static readonly META_MENU_DIR = 'meta/menu';

  constructor(
    protected readonly configService: ConfigService,
    protected readonly fileRepositoryService: FileRepositoryService,
  ) {}

  async findOne() {
    const metaFileName = MetaMenuService.META_MENU_DIR + '/MetaMenu.json';
    const metaMenuFromFile = JSON.parse(
      await this.fileRepositoryService.readFile(metaFileName),
    );

    const metaMenu: MetaMenu = Object.assign(new MetaMenu(), metaMenuFromFile);
    return metaMenu;
  }

  async update(metaMenu: MetaMenu) {
    const metaFileName = MetaMenuService.META_MENU_DIR + '/MetaMenu.json';

    await this.fileRepositoryService.writeFile(
      metaFileName,
      JSON.stringify(metaMenu, null, 2),
    );

    return;
  }

  getVersion(): any {
    const serverRelease = this.configService.get('SERVER_RELEASE', 'Unknown');
    return {
      serverRelease: serverRelease,
    };
  }
}
