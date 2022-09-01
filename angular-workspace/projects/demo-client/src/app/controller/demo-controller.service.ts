import {Injectable} from '@angular/core';
import {ActionListener} from '../../../../ngx-perfect-stack/src/lib/event/action-listener';
import {
  PropertyListProvider
} from '../../../../ngx-perfect-stack/src/lib/template/property-sheet/property-list-provider';
import {FormContext} from '../../../../ngx-perfect-stack/src/lib/data/data-edit/form-service/form.service';
import {
  Property,
  PropertyType
} from '../../../../ngx-perfect-stack/src/lib/template/property-sheet/property-sheet.service';

@Injectable({
  providedIn: 'root'
})
export class DemoControllerService implements ActionListener, PropertyListProvider {

  propertyList: Property[] = [
    {name: 'demoProperty1', type: PropertyType.string},
    {name: 'demoProperty2', type: PropertyType.string}
  ];

  constructor() { }

  onAction(ctx: FormContext, action: string): void {
  }



}
