export enum ComponentType {
  BadgeList = 'BadgeList',
  DatePicker = 'DatePicker',
  TextArea = 'TextArea',
  TextInput = 'TextInput',
  Select = 'Select',
  SelectTwo = 'SelectTwo',
}

export class Cell {
  width: string;
  height: string;
  attributeName?: string;
  component?: string; // The "type" of component used to display stuff in this cell, e.g. "Page reference"
  componentData?: ComponentData;
  noItemsHtml?: string; // Html displayed when no items
  tool?: Tool;
  template?: Template;
}

export class ComponentData {
}

export class SelectTwoComponentData implements ComponentData {
  secondaryAttributeName: string;
}

export enum TemplateType {
  form = 'form',
  table = 'table',
  card = 'card',
  map = 'map',
  chart = 'chart',
}

export enum TemplateLocationType {
  OuterTopRight = 'OuterTopRight',
  TopRight = 'TopRight',
  BottomLeft = 'BottomLeft',
  BottomMiddle = 'BottomMiddle',
  BottomRight = 'BottomRight'
}

export enum ToolType {
  Button = 'Button',
  ButtonGroup = 'ButtonGroup',
  ButtonTabs = 'ButtonTabs',
  TextTool = 'TextTool',
  Image = 'Image',
  Select = 'Select',
  Icon = 'Icon'
}

export class Tool {
  type: ToolType;
  containerStyles: string;
  styles: string;
  label: string;

  static isTool(something: any) {
    return something.type && Object.values(ToolType).indexOf(something.type) >= 0;
  }
}

export class ButtonTool extends Tool {
  action: string;
  route: string;
}

export class ButtonGroupTool extends Tool {
  action: string;
  route: string;
}

export class ButtonTabsTool extends Tool {
  templateIndex: number; // the template number that this tool will operate on
  template1: string; // The template names to use as Tabs. The Tab name will come from the template heading
  template2: string;
  template3: string;
  template4: string;
  template5: string;
  template6: string;
  template7: string;
}

export class ImageTool extends Tool {
  imageUrl: string;
}

export class TextTool extends Tool {
  text: string;
}

export class IconTool extends Tool {
  iconName: string;
}

export class TemplateLocationMap {
  [key: string] : Tool;
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
  locations: TemplateLocationMap;

  styles: string; // CSS style classes

  // for table templates
  customQuery?: string; // for when we need to call for complex custom queries
  orderByName: string; // Only for search result tables
  orderByDir: string; // Only for search result tables
  noItemsHtml: string; // Html displayed when no items
  navigation?: TemplateNavigationType;
  route?: string;
}

export enum TemplateNavigationType {
  Disabled = 'Disabled',
  Enabled = 'Enabled'
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
  Stockholm = 'Stockholm',
  Venice = 'Venice'
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
