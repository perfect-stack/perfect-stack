import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { NgxPerfectStackConfig, STACK_CONFIG } from '@perfect-stack/ngx-perfect-stack';

fetch('/client.json')
  .then((clientJsonResponse) => clientJsonResponse.json())
  .then((clientJson) => {
    if (clientJson.production) {
      enableProdMode();
    }

    console.log('Downloaded clientJson: ', clientJson);
    const mergedConfig = Object.assign({}, clientJson);

    fetch('/client-overrides.json')
      .then((clientOverridesJsonResponse) => clientOverridesJsonResponse.json())
      .then((clientOverridesJson) => {
        console.log('Downloaded clientOverridesJson: ', clientOverridesJson);
        Object.assign(mergedConfig, clientOverridesJson);
      })
      .catch(() => {
        // Overrides optional
      })
      .finally(() => {
        const stackConfig: NgxPerfectStackConfig = {
          apiUrl: mergedConfig.API_URL || 'http://localhost:3080',
          authenticationProvider: mergedConfig.AUTHENTICATION_PROVIDER || 'None',
          cognitoLoginUrl: mergedConfig.COGNITO_LOGIN_URL,
          clientRelease: mergedConfig.CLIENT_RELEASE || '1.0.0',
          dateFormat: mergedConfig.DATE_FORMAT || 'dd-MMM-yyyy',
          dateTimeFormat: mergedConfig.DATE_TIME_FORMAT || 'dd-MMM-yyyy HH:mm',
          timeFormat: mergedConfig.TIME_FORMAT || 'HH:mm',
          debug: mergedConfig.DEBUG || false,
          metaRoleList: [],
          copyrightFooter: mergedConfig.COPYRIGHT_FOOTER || 'Copyright ©2026 Vet Clinic',
          showMenuLoginBtn: mergedConfig.SHOW_MENU_LOGIN_BTN || false,
          supportEmail: mergedConfig.SUPPORT_EMAIL || 'support@vetclinic.test',
          dataSourceEditable: mergedConfig.DATA_SOURCE_EDITABLE || false,
          environmentBannerText: mergedConfig.ENVIRONMENT_BANNER_TEXT || '',
          supplementaryGroupRoles: mergedConfig.SUPPLEMENTARY_GROUP_ROLES,
          msalClientId: mergedConfig.MSAL_CLIENT_ID,
          msalAuthority: mergedConfig.MSAL_AUTHORITY,
          msalRedirectUri: mergedConfig.MSAL_REDIRECT_URI
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
        { provide: STACK_CONFIG, useValue: stackConfig }
      ])
        .bootstrapModule(AppModule)
        .catch((err: any) => console.error(err));
    })
    .catch((err: any) => {
      console.error('Failed to load metaRoleJson, bootstrapping anyway:', err);
      platformBrowserDynamic([
        { provide: STACK_CONFIG, useValue: stackConfig }
      ])
        .bootstrapModule(AppModule)
        .catch((bootstrapErr: any) => console.error(bootstrapErr));
    });
};
