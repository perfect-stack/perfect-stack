import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../../ngx-perfect-stack/src/lib/ngx-perfect-stack-config';


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
      clientRelease: configJson.CLIENT_RELEASE,
      dateFormat: configJson.DATE_FORMAT,
      dateTimeFormat: configJson.DATE_TIME_FORMAT,
      timeFormat: configJson.TIME_FORMAT,
    };

    platformBrowserDynamic([
      { provide: STACK_CONFIG, useValue: stackConfig}
    ])
      .bootstrapModule(AppModule)
      .catch(err => console.error(err))
});
