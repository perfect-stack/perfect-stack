
export class Cell {
  width: string;
  height: string;
  attributeName?: string;
  component?: string;  // The "type" of component used to display stuff in this cell, e.g. "Page reference"
}

export class Template {
  name: string;
  cells: Cell[][] = [
    [
      {width: '3', height: '1'},
      {width: '3', height: '1'},
      {width: '3', height: '1'},
      {width: '3', height: '1'},
    ],
    [
      {width: '6', height: '1'},
      {width: '6', height: '1'},
    ]
  ];
}

export type TemplateMap = {
  [key: string]: Template;
};

export type PageType = 'search' | 'view' | 'edit' | 'map' | 'content' | 'composite';

export class MetaPage {
  name: string;
  type: PageType;
  template: Template;
}
