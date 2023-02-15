import {ActionType} from './meta.role';

export enum ComponentType {
  BadgeList = 'BadgeList',
  DatePicker = 'DatePicker',
  FlexibleDateTime = 'FlexibleDateTime',
  LinkList = 'LinkList',
  ManyToOnePlain = 'ManyToOnePlain',
  ManyToOneLink = 'ManyToOneLink',
  TextArea = 'TextArea',
  TextInput = 'TextInput',
  Select = 'Select',
  SelectTwo = 'SelectTwo',
  SelectMultiple = 'SelectMultiple',
  Spy = 'Spy',
}

export enum LabelLayoutType {
  Top = 'Top',
  Left = 'Left',
  Hidden = 'Hidden'
}

export class Cell {
  width: string;
  height: string;
  attributeName?: string;
  hideLabel?: boolean;
  labelLayout?: LabelLayoutType;
  component?: string; // The "type" of component used to display stuff in this cell, e.g. "Page reference"
  componentData?: ComponentData;
  dependsOn?: string; // Another attribute that the Component in this Cell will listen to value changes of
  showClear?: string;
  showModifiers?: string;
  noItemsHtml?: string; // Html displayed when no items
  footerHtml?: string; // Footer html that appears under the component (only in edit mode)
  tool?: Tool;
  template?: Template;
}

export class ComponentData {}

export class SelectTwoComponentData implements ComponentData {
  secondaryAttributeName: string;
}

export enum TemplateType {
  header = 'header',
  form = 'form',
  table = 'table',
  card = 'card',
  map = 'map',
  chart = 'chart',
}

export enum TemplateLocationType {
  TopRight = 'TopRight',
  BottomLeft = 'BottomLeft',
  BottomMiddle = 'BottomMiddle',
  BottomRight = 'BottomRight',
}

export enum ToolType {
  Button = 'Button',
  ButtonGroup = 'ButtonGroup',
  ButtonTabs = 'ButtonTabs',
  Icon = 'Icon',
  Image = 'Image',
  LastSignIn = 'LastSignIn',
  Link = 'Link',
  Map = 'Map',
  PageTitle = 'PageTitle',
  Paginate = 'Paginate',
  Select = 'Select',
  TabTool = 'TabTool',
  TextTool = 'TextTool',
}

export class Tool {
  type: ToolType;
  channel: string; // when this tool publishes events they will be published to this channel
  containerStyles: string;
  styles: string;
  label: string;
  modes: string; // comma separated list of modes for when this Tool will be made visible. If blank, then it's always visible.

  static isTool(something: any) {
    return (
      something.type && Object.values(ToolType).indexOf(something.type) >= 0
    );
  }
}

export class ButtonTool extends Tool {
  action: string;
  route: string;
  icon: string;
  actionPermit: ActionType;
  subjectPermit: string;
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

export class DurationTool extends Tool {

}

export class ImageTool extends Tool {
  imageUrl: string;
}

export class LastSignInTool extends Tool {
  username: string;
}

export class LinkTool extends Tool {
  action: string;
  route: string;
  text: string; // This does not support full html, just put <a>markers around the link text</a>
}

export class MapTool extends Tool {
  easting: string;
  northing: string;
}

export class PageTitleTool extends Tool {
  nameAttributes: string;
}

export class PaginateTool extends Tool {
  criteriaForm: string;
}

export class TabTool extends Tool {
  template1: string; // The template names to use as Tabs. The Tab name will come from the template heading
  template2: string;
  template3: string;
  template4: string;
  template5: string;
  template6: string;
  template7: string;
}

export class TextTool extends Tool {
  text: string;
}

export class IconTool extends Tool {
  iconName: string;
}

export class TemplateLocationMap {
  [key: string]: Tool;
}

export class Template {
  templateHeading: string;
  binding: string;
  metaEntityName: string;
  type: TemplateType;
  showSideHeadings?: TemplateShowSideHeadingsType;
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
  visible?: boolean; // Dynamically display/hide this template (true by default)
}

export enum TemplateShowSideHeadingsType {
  Disabled = 'Disabled',
  Enabled = 'Enabled',
}

export enum TemplateNavigationType {
  Disabled = 'Disabled',
  Enabled = 'Enabled',
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
  Venice = 'Venice',
}

export enum ResultCardinalityType {
  QueryOne = 'QueryOne',
  QueryMany = 'QueryMany',
}

export enum QueryType {
  Entity = 'Entity',
  Custom = 'Custom',
}

export class DataQuery {
  dataName: string;
  resultCardinality: ResultCardinalityType;
  queryType: QueryType;
  queryName: string;
  metaEntityName: string;
  fieldName: string;
  parameter: string;
  orderByName: string;
  orderByDir: string;
}

export class Controller {
  name: string;
  class: string;
}

export class MetaPage {
  name: string;
  title: string;
  type: PageType;
  layoutStyle: LayoutStyle;
  dataQueryList: DataQuery[] = [];
  controllers: Controller[] = [];
  templates: Template[] = [];
}
