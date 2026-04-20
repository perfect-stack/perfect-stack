import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgxPerfectStackModule } from 'ngx-perfect-stack';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgxPerfectStackModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }