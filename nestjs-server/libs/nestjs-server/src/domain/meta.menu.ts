export class MenuItem {
  label: string;
  route: string;
  editable = true;
  roles: string[] = [];
}

export class Menu {
  label: string;
  items: MenuItem[] = [];
}

export class MetaMenu {
  menuList: Menu[] = [];
}
