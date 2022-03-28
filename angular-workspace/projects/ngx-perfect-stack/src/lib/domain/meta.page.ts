

export enum ComponentType {
  TextInput = 'TextInput',
  TextArea = 'TextArea',
  DatePicker = 'DatePicker',
  Select = 'Select',
}

export class Cell {
  width: string;
  height: string;
  attributeName?: string;
  component?: string; // The "type" of component used to display stuff in this cell, e.g. "Page reference"
  template?: Template;
}

export enum TemplateType {
  form = 'form',
  table = 'table',
  map = 'map',
  chart = 'chart',
}

export class Template {
  metaEntityName: string;
  type: TemplateType;
  cells: Cell[][] = [
    [
      { width: '3', height: '1' },
      { width: '3', height: '1' },
      { width: '3', height: '1' },
      { width: '3', height: '1' },
    ],
    [
      { width: '6', height: '1' },
      { width: '6', height: '1' },
    ],
  ];
  orderByName: string; // Only for search result tables
  orderByDir: string; // Only for search result tables
}

export type TemplateMap = {
  [key: string]: Template;
};

export enum PageType {
  search = 'search',
  search_edit = 'search_edit',
  view_edit = 'view_edit',
  map = 'map',
  content = 'content',
  composite = 'composite',
}

export class MetaPage {
  name: string;
  title: string;
  type: PageType;
  templates: Template[] = [];
}
