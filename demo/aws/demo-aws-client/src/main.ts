import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import {NgxPerfectStackConfig, STACK_CONFIG} from '@perfect-stack/ngx-perfect-stack';
import {AppModule} from './app/app.module';


fetch('/client.json')
  .then( (configResponse) => configResponse.json())
  .then( (configJson) => {

    if(configJson.production) {
      enableProdMode();
    }

    console.log('Downloaded configJson: ', configJson);
    const stackConfig: NgxPerfectStackConfig = {
      apiUrl: configJson.API_URL,
      authenticationProvider: configJson.AUTHENTICATION_PROVIDER,
      cognitoLoginUrl: configJson.COGNITO_LOGIN_URL,
      clientRelease: configJson.CLIENT_RELEASE,
      dateFormat: configJson.DATE_FORMAT,
      dateTimeFormat: configJson.DATE_TIME_FORMAT,
      timeFormat: configJson.TIME_FORMAT,
      debug: configJson.DEBUG,
      metaRoleList: [],
      copyrightFooter: configJson.COPYRIGHT_FOOTER,
      showMenuLoginBtn: configJson.SHOW_MENU_LOGIN_BTN,
      supportEmail: configJson.SUPPORT_EMAIL,
      dataSourceEditable: configJson.DATA_SOURCE_EDITABLE,
      environmentBannerText: configJson.ENVIRONMENT_BANNER_TEXT,
      supplementaryGroupRoles: configJson.SUPPLEMENTARY_GROUP_ROLES,
      msalClientId: configJson.MSAL_CLIENT_ID,
      msalAuthority: configJson.MSAL_AUTHORITY,
      msalRedirectUri: configJson.MSAL_REDIRECT_URI
    };

    platformBrowserDynamic([
      { provide: STACK_CONFIG, useValue: stackConfig}
    ])
      .bootstrapModule(AppModule)
      .catch(err => console.error(err))
  });
