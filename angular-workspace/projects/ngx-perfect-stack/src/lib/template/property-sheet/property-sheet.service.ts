import {EventEmitter, Injectable} from '@angular/core';
import {Template, TemplateNavigationType, TemplateType} from '../../domain/meta.page';

@Injectable({
  providedIn: 'root'
})
export class PropertySheetService {

  editEvent$ = new EventEmitter<PropertyEditEvent>();

  constructor() { }

  edit(source: any) {
    if(source.type) {
      this.editWithType(source, source.type);
    }
    else {
      throw new Error(`The supplied source object has no "type" attribute defined: ${JSON.stringify(source)}`);
    }
  }

  editWithType(source: any, type: string) {
    const propertyList = PropertyListMap[type];
    if(propertyList) {
      this.editEvent$.emit({
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
  source: any;
  propertyList: Property[]
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
  { name: 'route', type: PropertyType.route},
];

export const ImagePropertyList = [
  { name: 'containerStyles', type: PropertyType.string},
  { name: 'styles', type: PropertyType.string},
  { name: 'imageUrl', type: PropertyType.string},
];

export const TextToolPropertyList = [
  { name: 'containerStyles', type: PropertyType.string},
  { name: 'styles', type: PropertyType.string},
  { name: 'text', type: PropertyType.string},
];

// Not all the properties, just the ones we wanted to edit via the property sheet
export const TemplatePropertyList = [
  { name: 'binding', type: PropertyType.string},
  { name: 'metaEntityName', type: PropertyType.metaEntity},
  { name: 'type', type: PropertyType.string, options: TemplateType},
  { name: 'orderByName', type: PropertyType.string},
  { name: 'orderByDir', type: PropertyType.string, options: ['ASC', 'DESC']},
  { name: 'navigation', type: PropertyType.string, options: TemplateNavigationType},
  { name: 'route', type: PropertyType.string},
];


export type PropertyListMapType = {
  [key: string]: Property[]
};

export const PropertyListMap: PropertyListMapType = {
  'Button': ButtonPropertyList,
  'Image': ImagePropertyList,
  'TextTool': TextToolPropertyList,
  'Template': TemplatePropertyList,
};
