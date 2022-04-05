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
      apiUrl: configJson.API_URL
    };

    platformBrowserDynamic([
      { provide: STACK_CONFIG, useValue: stackConfig}
    ])
      .bootstrapModule(AppModule)
      .catch(err => console.error(err))
  });
