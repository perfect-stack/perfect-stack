import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {NgxPerfectStackModule} from '@perfect-stack/ngx-perfect-stack';

@NgModule({
  declarations: [
    AppComponent
  ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        NgxPerfectStackModule
    ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
