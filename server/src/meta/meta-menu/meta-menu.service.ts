import { Injectable } from '@nestjs/common';
import { MetaMenu } from '../../domain/meta.menu';
import { LocalFileRepository } from '../../file/local-file-respository';

@Injectable()
export class MetaMenuService {
  static readonly META_MENU_DIR = 'meta/menu';

  constructor(protected readonly fileRepository: LocalFileRepository) {}

  async findOne() {
    const metaFileName = MetaMenuService.META_MENU_DIR + '/MetaMenu.json';
    const metaMenuFromFile = JSON.parse(
      await this.fileRepository.readFile(metaFileName),
    );

    const metaMenu: MetaMenu = Object.assign(new MetaMenu(), metaMenuFromFile);

    // for (let i = 0; i < metaMenu.menuList.length; i++) {
    //   const nextMenu = metaMenu.menuList[i];
    // }

    return metaMenu;
  }
}
