

export enum ComponentType {
  TextInput = 'TextInput',
  TextArea = 'TextArea',
  DatePicker = 'DatePicker',
  Select = 'Select',
  SelectTwo = 'SelectTwo',
  StaticImage = 'StaticImage',
}

export class Cell {
  width: string;
  height: string;
  attributeName?: string;
  component?: string; // The "type" of component used to display stuff in this cell, e.g. "Page reference"
  componentData?: ComponentData;
  template?: Template;
}

export class ComponentData {}

export class SelectTwoComponentData implements ComponentData {
  secondaryAttributeName: string;
}

export class StaticImageComponentData implements ComponentData {
  assetUrl: string;
}

export enum TemplateType {
  form = 'form',
  table = 'table',
  card = 'card',
  map = 'map',
  chart = 'chart',
}

export class Template {
  templateHeading: string;
  binding: string;
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

export enum LayoutStyle {
  NewYork = 'New York',
  Paris = 'Paris',
  Stockholm = 'Stockholm'
}

export enum ResultCardinalityType {
  QueryOne = 'QueryOne',
  QueryMany = 'QueryMany',
}

export enum QueryType {
  Entity = 'Entity',
  Custom = 'Custom'
}

export class DataQuery {
  dataName: string;
  resultCardinality: ResultCardinalityType;
  queryType: QueryType;
  queryName: string;
  fieldName: string;
  parameter: string;
}


export class MetaPage {
  name: string;
  title: string;
  type: PageType;
  layoutStyle: LayoutStyle;
  dataQueryList: DataQuery[] = [];
  templates: Template[] = [];
}
