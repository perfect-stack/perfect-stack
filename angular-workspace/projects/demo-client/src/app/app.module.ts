import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {NgxPerfectStackModule} from '../../../ngx-perfect-stack/src/lib/ngx-perfect-stack.module';
//import {environment} from '../environments/environment';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
      BrowserModule,
      AppRoutingModule,
      NgxPerfectStackModule,
      NgbModule
  ],
  providers: [
    // Sets up a provided value for injection into ngx-perfect-stack services
    //{provide: 'environment', useValue: environment}
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
