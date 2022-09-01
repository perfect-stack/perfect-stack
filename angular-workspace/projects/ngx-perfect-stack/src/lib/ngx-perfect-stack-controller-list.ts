import {InjectionToken} from '@angular/core';
import {NgxPerfectStackConfig} from './ngx-perfect-stack-config';

export const CONTROLLER_LIST = new InjectionToken<NgxPerfectStackConfig>('NgxPerfectControllerList');

export interface NgxPerfectControllerList {
  controllers: string[];
}
