import { Injectable } from '@nestjs/common';
import { MetaMenu } from '../../domain/meta.menu';
import * as fs from 'fs';

@Injectable()
export class MetaMenuService {
  static readonly META_MENU_DIR = 'meta/menu';

  findOne() {
    const metaFileName = MetaMenuService.META_MENU_DIR + '/MetaMenu.json';
    if (fs.existsSync(metaFileName)) {
      const metaMenuFromFile = JSON.parse(
        fs.readFileSync(metaFileName, 'utf8'),
      );

      const metaMenu: MetaMenu = Object.assign(
        new MetaMenu(),
        metaMenuFromFile,
      );

      for (let i = 0; i < metaMenu.menuList.length; i++) {
        const nextMenu = metaMenu.menuList[i];
      }

      return metaMenu;
    } else {
      throw new Error(`Unable to find file for "${metaFileName}"`);
    }
  }
}
