import { Injectable } from '@nestjs/common';
import { MetaMenu } from '../../domain/meta.menu';
import { FileRepositoryService } from '../../file/file-repository.service';

@Injectable()
export class MetaMenuService {
  static readonly META_MENU_DIR = 'meta/menu';

  constructor(
    protected readonly fileRepositoryService: FileRepositoryService,
  ) {}

  async findOne() {
    const metaFileName = MetaMenuService.META_MENU_DIR + '/MetaMenu.json';
    const metaMenuFromFile = JSON.parse(
      await this.fileRepositoryService.readFile(metaFileName),
    );

    const metaMenu: MetaMenu = Object.assign(new MetaMenu(), metaMenuFromFile);

    // for (let i = 0; i < metaMenu.menuList.length; i++) {
    //   const nextMenu = metaMenu.menuList[i];
    // }

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
}
