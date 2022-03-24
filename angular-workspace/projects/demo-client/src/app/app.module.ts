import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgxPerfectStackModule } from 'ngx-perfect-stack';

@NgModule({
  declarations: [
    AppComponent
  ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        NgxPerfectStackModule,
        NgxPerfectStackModule
    ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
