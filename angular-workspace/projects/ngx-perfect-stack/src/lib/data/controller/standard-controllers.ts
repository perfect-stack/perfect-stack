import {InjectionToken} from '@angular/core';
import {NgxPerfectStackConfig} from '../../ngx-perfect-stack-config';


export const STANDARD_CONTROLLERS = new InjectionToken<NgxPerfectStackConfig>('STANDARD_CONTROLLERS');

export interface StandardControllers {
  controllers: string[];
}

export const standardControllers: StandardControllers = {
  controllers: [
    'SearchController'
  ]
}
