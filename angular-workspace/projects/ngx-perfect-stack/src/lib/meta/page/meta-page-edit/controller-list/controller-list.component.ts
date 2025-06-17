import {Component, Injector, Input, OnInit} from '@angular/core';
import {Controller} from '../../../../domain/meta.page';
import {PropertySheetService} from '../../../../template/property-sheet/property-sheet.service';
import {CONTROLLER_LIST, NgxPerfectControllerList} from '../../../../ngx-perfect-stack-controller-list';
import {STANDARD_CONTROLLERS, StandardControllers} from '../../../../data/controller/standard-controllers';

@Component({
    selector: 'lib-controller-list',
    templateUrl: './controller-list.component.html',
    styleUrls: ['./controller-list.component.css'],
    standalone: false
})
export class ControllerListComponent implements OnInit {

  @Input()
  controllers: Controller[] = [];

  constructor(protected readonly propertySheetService: PropertySheetService,
              protected readonly injector: Injector) { }

  ngOnInit(): void {
  }

  getControllerList(): string[] {
    const controllerList = this.injector.get<NgxPerfectControllerList>(CONTROLLER_LIST);
    if(!controllerList) {
      throw new Error('Application must define the list of available Controllers. No provider for CONTROLLER_LIST is available.');
    }

    const standardControllers = this.injector.get<StandardControllers>(STANDARD_CONTROLLERS);
    if(!standardControllers) {
      throw new Error('Application must define the list of standard Controllers. No provider for STANDARD_CONTROLLERS is available.');
    }

    const combinedControllers = controllerList.controllers.concat(standardControllers.controllers);
    return combinedControllers;
  }

  onAddController() {
    console.log(`Add Controller`);
    this.controllers.push({
      name: 'ControllerName',
      class: 'Class',
    });
  }

  onDelete(i: number) {
    console.log(`Delete controller`);
    this.controllers?.splice(i, 1);
  }

  onSettings(controller: Controller) {
    console.log(`Edit Settings for controller`);
    const controllerClass = this.injector.get(controller.class);
    const propertyList = controllerClass.propertyList;
    this.propertySheetService.editWithPropertyList(controller.name, controller, propertyList);
  }
}
