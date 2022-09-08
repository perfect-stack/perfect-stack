import {EventEmitter, Injectable} from '@angular/core';
import {
  ComponentType, LabelLayoutType,
  TemplateNavigationType,
  TemplateShowSideHeadingsType,
  TemplateType
} from '../../domain/meta.page';

@Injectable({
  providedIn: 'root'
})
export class PropertySheetService {

  editEvent$ = new EventEmitter<PropertyEditEvent>();

  constructor() { }

  edit(title: string, source: any) {
    console.log(`PropertySheetService: edit ${title} of source type = ${source.type}`);
    if(source.type) {
      this.editWithType(title, source, source.type);
    }
    else {
      throw new Error(`The supplied source object has no "type" attribute defined: ${JSON.stringify(source)}`);
    }
  }

  editWithType(title: string, source: any, type: string) {
    const propertyList = PropertyListMap[type];
    if(propertyList) {
      this.editWithPropertyList(title, source, propertyList)
    }
    else {
      throw new Error(`Unable to find property list for tool type of ${type}`)
    }
  }

  editWithPropertyList(title: string, source: any, propertyList: Property[]) {
    this.editEvent$.emit({
      title: title,
      source: source,
      propertyList: propertyList
    });
  }
}

export interface PropertyEditEvent {
  title: string;
  source: any;
  propertyList: Property[];
}

export enum PropertyType {
  string = 'string',
  number = 'number',
  boolean = 'boolean',
  route = 'route',
  metaEntity = 'metaEntity',
  metaPage = 'metaPage',
  componentType = 'componentType',
}

export class Property {
  name: string;
  type: PropertyType;
  options?: any;
}


export const ButtonPropertyList = [
  { name: 'channel', type: PropertyType.string},
  { name: 'containerStyles', type: PropertyType.string},
  { name: 'styles', type: PropertyType.string},
  { name: 'label', type: PropertyType.string},
  { name: 'modes', type: PropertyType.string},
  { name: 'action', type: PropertyType.string},
  { name: 'route', type: PropertyType.route},
];

export const ButtonGroupPropertyList = [
  { name: 'channel', type: PropertyType.string},
  { name: 'containerStyles', type: PropertyType.string},
  { name: 'styles', type: PropertyType.string},
  { name: 'label', type: PropertyType.string},
  { name: 'modes', type: PropertyType.string},
  { name: 'action', type: PropertyType.string},
  { name: 'route', type: PropertyType.route},
];

export const ButtonTabsPropertyList = [
  { name: 'channel', type: PropertyType.string},
  { name: 'containerStyles', type: PropertyType.string},
  { name: 'styles', type: PropertyType.string},
  { name: 'label', type: PropertyType.string},
  { name: 'modes', type: PropertyType.string},
  { name: 'templateIndex', type: PropertyType.number},
  { name: 'template1', type: PropertyType.metaPage},
  { name: 'template2', type: PropertyType.metaPage},
  { name: 'template3', type: PropertyType.metaPage},
  { name: 'template4', type: PropertyType.metaPage},
  { name: 'template5', type: PropertyType.metaPage},
  { name: 'template6', type: PropertyType.metaPage},
  { name: 'template7', type: PropertyType.metaPage},
];

export const ImagePropertyList = [
  { name: 'channel', type: PropertyType.string},
  { name: 'containerStyles', type: PropertyType.string},
  { name: 'styles', type: PropertyType.string},
  { name: 'label', type: PropertyType.string},
  { name: 'modes', type: PropertyType.string},
  { name: 'imageUrl', type: PropertyType.string},
];

export const LastSignInPropertyList = [
  { name: 'channel', type: PropertyType.string},
  { name: 'containerStyles', type: PropertyType.string},
  { name: 'styles', type: PropertyType.string},
  { name: 'label', type: PropertyType.string},
  { name: 'modes', type: PropertyType.string},
  { name: 'username', type: PropertyType.string},
];

export const LinkPropertyList = [
  { name: 'channel', type: PropertyType.string},
  { name: 'containerStyles', type: PropertyType.string},
  { name: 'styles', type: PropertyType.string},
  { name: 'label', type: PropertyType.string},
  { name: 'modes', type: PropertyType.string},
  { name: 'action', type: PropertyType.string},
  { name: 'route', type: PropertyType.route},
  { name: 'text', type: PropertyType.string},
];

export const MapPropertyList = [
  { name: 'channel', type: PropertyType.string},
  { name: 'containerStyles', type: PropertyType.string},
  { name: 'styles', type: PropertyType.string},
  { name: 'label', type: PropertyType.string},
  { name: 'modes', type: PropertyType.string},
  { name: 'easting', type: PropertyType.string},
  { name: 'northing', type: PropertyType.string},
];

export const PageTitlePropertyList = [
  { name: 'channel', type: PropertyType.string},
  { name: 'containerStyles', type: PropertyType.string},
  { name: 'styles', type: PropertyType.string},
  { name: 'label', type: PropertyType.string},
  { name: 'modes', type: PropertyType.string},
  { name: 'nameAttributes', type: PropertyType.string},
];

export const PaginatePropertyList = [
  { name: 'channel', type: PropertyType.string},
  { name: 'containerStyles', type: PropertyType.string},
  { name: 'styles', type: PropertyType.string},
  { name: 'label', type: PropertyType.string},
  { name: 'modes', type: PropertyType.string},
  { name: 'criteriaForm', type: PropertyType.string}
];

export const TabPropertyList = [
  { name: 'channel', type: PropertyType.string},
  { name: 'containerStyles', type: PropertyType.string},
  { name: 'styles', type: PropertyType.string},
  { name: 'label', type: PropertyType.string},
  { name: 'modes', type: PropertyType.string},
  { name: 'template1', type: PropertyType.metaPage},
  { name: 'template2', type: PropertyType.metaPage},
  { name: 'template3', type: PropertyType.metaPage},
  { name: 'template4', type: PropertyType.metaPage},
  { name: 'template5', type: PropertyType.metaPage},
  { name: 'template6', type: PropertyType.metaPage},
  { name: 'template7', type: PropertyType.metaPage},
];

export const TextToolPropertyList = [
  { name: 'channel', type: PropertyType.string},
  { name: 'containerStyles', type: PropertyType.string},
  { name: 'styles', type: PropertyType.string},
  { name: 'label', type: PropertyType.string},
  { name: 'modes', type: PropertyType.string},
  { name: 'text', type: PropertyType.string},
];

export const IconPropertyList = [
  { name: 'channel', type: PropertyType.string},
  { name: 'containerStyles', type: PropertyType.string},
  { name: 'styles', type: PropertyType.string},
  { name: 'label', type: PropertyType.string},
  { name: 'modes', type: PropertyType.string},
  { name: 'iconName', type: PropertyType.string},
];

// Not all the properties, just the ones we wanted to edit via the property sheet
export const TemplatePropertyList = [
  { name: 'binding', type: PropertyType.string},
  { name: 'metaEntityName', type: PropertyType.metaEntity},
  { name: 'type', type: PropertyType.string, options: TemplateType},
  { name: 'showSideHeadings', type: PropertyType.string, options: TemplateShowSideHeadingsType},
  { name: 'styles', type: PropertyType.string},
  { name: 'customQuery', type: PropertyType.string},
  { name: 'orderByName', type: PropertyType.string},
  { name: 'orderByDir', type: PropertyType.string, options: ['ASC', 'DESC']},
  { name: 'noItemsHtml', type: PropertyType.string},
  { name: 'navigation', type: PropertyType.string, options: TemplateNavigationType},
  { name: 'route', type: PropertyType.string},
];

// Cell Properties
export const CellPropertyList = [
  { name: 'component', type: PropertyType.string, options: ComponentType},
  { name: 'hideLabel', type: PropertyType.boolean},
  { name: 'labelLayout', type: PropertyType.string, options: LabelLayoutType},
  { name: 'secondaryAttributeName', type: PropertyType.string},
  { name: 'noItemsHtml', type: PropertyType.string},
  { name: 'footerHtml', type: PropertyType.string},
  { name: 'spyTemplate', type: PropertyType.metaPage},
]


export type PropertyListMapType = {
  [key: string]: Property[]
};

export const PropertyListMap: PropertyListMapType = {
  'Button': ButtonPropertyList,
  'ButtonGroup': ButtonGroupPropertyList,
  'ButtonTabs': ButtonTabsPropertyList,
  'Icon': IconPropertyList,
  'Image': ImagePropertyList,
  'LastSignIn': LastSignInPropertyList,
  'Link': LinkPropertyList,
  'Map': MapPropertyList,
  'PageTitle': PageTitlePropertyList,
  'Paginate': PaginatePropertyList,
  'TabTool': TabPropertyList,
  'TextTool': TextToolPropertyList,
  'Template': TemplatePropertyList,
  'Cell': CellPropertyList,
};
