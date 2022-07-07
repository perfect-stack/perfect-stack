import {EventEmitter, Injectable} from '@angular/core';
import {ComponentType, TemplateNavigationType, TemplateType} from '../../domain/meta.page';

@Injectable({
  providedIn: 'root'
})
export class PropertySheetService {

  editEvent$ = new EventEmitter<PropertyEditEvent>();

  constructor() { }

  edit(title: string, source: any) {
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
      this.editEvent$.emit({
        title: title,
        source: source,
        propertyList: propertyList
      });
    }
    else {
      throw new Error(`Unable to find property list for tool type of ${type}`)
    }
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
  route = 'route',
  metaEntity = 'metaEntity',
  componentType = 'componentType',
}

export class Property {
  name: string;
  type: PropertyType;
  options?: any;
}


export const ButtonPropertyList = [
  { name: 'containerStyles', type: PropertyType.string},
  { name: 'styles', type: PropertyType.string},
  { name: 'label', type: PropertyType.string},
  { name: 'action', type: PropertyType.string},
  { name: 'route', type: PropertyType.route},
];

export const ImagePropertyList = [
  { name: 'containerStyles', type: PropertyType.string},
  { name: 'styles', type: PropertyType.string},
  { name: 'label', type: PropertyType.string},
  { name: 'imageUrl', type: PropertyType.string},
];

export const TextToolPropertyList = [
  { name: 'containerStyles', type: PropertyType.string},
  { name: 'styles', type: PropertyType.string},
  { name: 'label', type: PropertyType.string},
  { name: 'text', type: PropertyType.string},
];

export const IconPropertyList = [
  { name: 'containerStyles', type: PropertyType.string},
  { name: 'styles', type: PropertyType.string},
  { name: 'label', type: PropertyType.string},
  { name: 'iconName', type: PropertyType.string},
];

// Not all the properties, just the ones we wanted to edit via the property sheet
export const TemplatePropertyList = [
  { name: 'binding', type: PropertyType.string},
  { name: 'metaEntityName', type: PropertyType.metaEntity},
  { name: 'type', type: PropertyType.string, options: TemplateType},
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
  { name: 'secondaryAttributeName', type: PropertyType.string},
  { name: 'noItemsHtml', type: PropertyType.string},
]


export type PropertyListMapType = {
  [key: string]: Property[]
};

export const PropertyListMap: PropertyListMapType = {
  'Button': ButtonPropertyList,
  'Icon': IconPropertyList,
  'Image': ImagePropertyList,
  'TextTool': TextToolPropertyList,
  'Template': TemplatePropertyList,
  'Cell': CellPropertyList,
};
