import {InjectionToken} from '@angular/core';

export const STACK_CONFIG = new InjectionToken<NgxPerfectStackConfig>('NgxPerfectStackConfig');

export interface NgxPerfectStackConfig {
  apiUrl: string;
  authenticationProvider: string; // FIREBASE, COGNITO
}
