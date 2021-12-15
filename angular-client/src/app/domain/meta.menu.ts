export class MenuItem {
  label: string;
  route: string;
  editable = true;
  roles: string[] = [];
}

export class MetaMenu {
  menuList: MenuItem[][];
}
