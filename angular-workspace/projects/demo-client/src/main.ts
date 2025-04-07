import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../../ngx-perfect-stack/src/lib/ngx-perfect-stack-config';


fetch('/client.json')
  .then( (clientJsonResponse) => clientJsonResponse.json())
  .then( (clientJson) => {

    if(clientJson.production) {
      enableProdMode();
    }

    console.log('Downloaded clientJson: ', clientJson);
    const mergedConfig = Object.assign({}, clientJson);

    fetch('/client-overrides.json')
      .then( (clientOverridesJsonResponse) => clientOverridesJsonResponse.json())
      .then( (clientOverridesJson) => {

        console.log('Downloaded clientOverridesJson: ', clientOverridesJson);
        Object.assign(mergedConfig, clientOverridesJson);

    }).finally(() => {
      const stackConfig: NgxPerfectStackConfig = {
        apiUrl: mergedConfig.API_URL,
        authenticationProvider: mergedConfig.AUTHENTICATION_PROVIDER,
        cognitoLoginUrl: mergedConfig.COGNITO_LOGIN_URL,
        clientRelease: mergedConfig.CLIENT_RELEASE,
        dateFormat: mergedConfig.DATE_FORMAT,
        dateTimeFormat: mergedConfig.DATE_TIME_FORMAT,
        timeFormat: mergedConfig.TIME_FORMAT,
        debug: mergedConfig.DEBUG,
        metaRoleList: [],
        copyrightFooter: mergedConfig.COPYRIGHT_FOOTER,
        showMenuLoginBtn: mergedConfig.SHOW_MENU_LOGIN_BTN,
        supportEmail: mergedConfig.SUPPORT_EMAIL,
        dataSourceEditable: mergedConfig.DATA_SOURCE_EDITABLE,
        environmentBannerText: mergedConfig.ENVIRONMENT_BANNER_TEXT,
        supplementaryGroupRoles: mergedConfig.SUPPLEMENTARY_GROUP_ROLES
      };

      loadPerfectStack(stackConfig);
    });
});



const loadPerfectStack = (stackConfig: NgxPerfectStackConfig) => {
  fetch(`${stackConfig.apiUrl}/meta/role`)
    .then((metaRoleResponse) => metaRoleResponse.json())
    .then((metaRoleJson) => {
      console.log('Downloaded metaRoleJson:', metaRoleJson);
      stackConfig.metaRoleList = metaRoleJson;

      platformBrowserDynamic([
        { provide: STACK_CONFIG, useValue: stackConfig}
      ])
        .bootstrapModule(AppModule)
        .catch(err => console.error(err))
    });
}
