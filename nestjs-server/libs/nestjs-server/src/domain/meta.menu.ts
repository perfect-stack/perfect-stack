export enum OpenIn {
  Current = 'Current',
  NewTab = 'New Tab',
  NewWindow = 'New Window',
}

export enum MenuItemType {
  Link = 'link',
  Separator = 'separator',
}

export class MenuItem {
  type?: MenuItemType = MenuItemType.Link;
  label?: string;
  route?: string;
  editable? = true;
  roles?: string[] = [];
  openIn?: OpenIn = OpenIn.Current;
  environments?: string[] = [];
}

export class Menu {
  label: string;
  items: MenuItem[] = [];
}

export class MetaMenu {
  menuList: Menu[] = [];
}
