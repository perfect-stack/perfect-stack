export enum OpenIn {
  Current = 'Current',
  NewTab = 'New Tab',
  NewWindow = 'New Window',
}

export class MenuItem {
  label: string;
  route: string;
  editable = true;
  roles: string[] = [];
  openIn?: OpenIn = OpenIn.Current;
}

export class Menu {
  label: string;
  items: MenuItem[] = [];
}

export class MetaMenu {
  menuList: Menu[] = [];
}
