import {InjectionToken} from '@angular/core';
import {MetaRole} from './domain/meta.role';

export const STACK_CONFIG = new InjectionToken<NgxPerfectStackConfig>('NgxPerfectStackConfig');

export interface NgxPerfectStackConfig {
  apiUrl: string;
  authenticationProvider: string;
  cognitoLoginUrl: string;
  clientRelease: string;
  dateFormat: string;
  dateTimeFormat: string;
  timeFormat: string;
  debug: boolean;
  metaRoleList: MetaRole[],
  supportEmail: string;
  showMenuLoginBtn: boolean;
  copyrightFooter: string;
  dataSourceEditable: boolean;
  environmentBannerText: string;
  supplementaryGroupRoles: string;
}
