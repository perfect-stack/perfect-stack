import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { NgxPerfectStackConfig, STACK_CONFIG } from 'ngx-perfect-stack';

async function bootstrap() {
  try {
    // 1. Fetch client configuration
    const clientResponse = await fetch('/client.json');
    const clientConfig = await clientResponse.json();

    // 2. Fetch and merge overrides (if they exist)
    let overridesConfig = {};
    try {
      const overridesResponse = await fetch('/client-overrides.json');
      if (overridesResponse.ok) {
        overridesConfig = await overridesResponse.json();
        console.log('Downloaded clientOverridesJson: ', overridesConfig);
      }
    } catch (e) {
      console.log('client-overrides.json not found or failed to parse, continuing without it.');
    }

    const mergedConfig = { ...clientConfig, ...overridesConfig };
    console.log('Downloaded and merged config: ', mergedConfig);

    // 3. Set production mode if specified
    if (mergedConfig.production) {
      enableProdMode();
    }

    // 4. Fetch meta roles from the API
    let metaRoleList = [];
    try {
        const metaRoleResponse = await fetch(`${mergedConfig.API_URL}/meta/role`);
        metaRoleList = await metaRoleResponse.json();
        console.log('Downloaded metaRoleJson:', metaRoleList);
    } catch (e) {
        console.error('Failed to download meta/role. The application may not function correctly.', e);
    }

    // 5. Create the final stack configuration
    const stackConfig: NgxPerfectStackConfig = {
      apiUrl: mergedConfig.API_URL,
      authenticationProvider: mergedConfig.AUTHENTICATION_PROVIDER,
      cognitoLoginUrl: mergedConfig.COGNITO_LOGIN_URL,
      clientRelease: mergedConfig.CLIENT_RELEASE,
      dateFormat: mergedConfig.DATE_FORMAT,
      dateTimeFormat: mergedConfig.DATE_TIME_FORMAT,
      timeFormat: mergedConfig.TIME_FORMAT,
      debug: mergedConfig.DEBUG,
      copyrightFooter: mergedConfig.COPYRIGHT_FOOTER,
      showMenuLoginBtn: mergedConfig.SHOW_MENU_LOGIN_BTN,
      supportEmail: mergedConfig.SUPPORT_EMAIL,
      dataSourceEditable: mergedConfig.DATA_SOURCE_EDITABLE,
      environmentBannerText: mergedConfig.ENVIRONMENT_BANNER_TEXT,
      supplementaryGroupRoles: mergedConfig.SUPPLEMENTARY_GROUP_ROLES,
      metaRoleList: metaRoleList,
    };

    // 6. Bootstrap the application with the dynamic configuration
    platformBrowserDynamic([{ provide: STACK_CONFIG, useValue: stackConfig }])
      .bootstrapModule(AppModule)
      .catch((err) => console.error('Bootstrap failed:', err));

  } catch (error) {
    console.error('A critical error occurred during application bootstrap:', error);
  }
}

bootstrap();
