import {EventEmitter, Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PropertySheetService {

  editEvent$ = new EventEmitter<PropertyEditEvent>();

  constructor() { }

  edit(source: any, propertyList: Property[]) {
    this.editEvent$.emit({
      source: source,
      propertyList: propertyList
    });
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
}


export const ButtonPropertyList = [
  { name: 'styles', type: PropertyType.string},
  { name: 'label', type: PropertyType.string},
  { name: 'route', type: PropertyType.route},
];

export const ImagePropertyList = [
  { name: 'styles', type: PropertyType.string},
  { name: 'imageUrl', type: PropertyType.string},
];

export type PropertyListMapType = {
  [key: string]: Property[]
};

export const PropertyListMap: PropertyListMapType = {
  'Button': ButtonPropertyList,
  'Image': ImagePropertyList,
};
