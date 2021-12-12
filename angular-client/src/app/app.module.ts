import {APP_INITIALIZER, NgModule} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {PersonViewComponent} from './person/person-view/person-view.component';
import {PersonSearchComponent} from './person/person-search/person-search.component';
import {PersonEditComponent} from './person/person-edit/person-edit.component';
import {PersonService} from './person/person-service/person.service';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {AuthInterceptor} from './auth-interceptor';
import {getAuth, onAuthStateChanged} from 'firebase/auth';
import getFirebase from '../firebase';
import { LandingComponent } from './landing/landing.component';
import {AuthenticationService} from './authentication/authentication.service';
import { DataSearchComponent } from './data/data-search/data-search.component';
import { DataViewComponent } from './data/data-view/data-view.component';
import { DataEditComponent } from './data/data-edit/data-edit.component';


function initializeApp() {
  if(!getFirebase()) {
    throw new Error('Unable to initialise Firebase');
  }

  return new Promise((resolve, reject) => {
    onAuthStateChanged(getAuth(), (user) => {
      if (user) {
        console.log(`initializeApp: user "${user.displayName}" is signed IN`);
        resolve(user);
      } else {
        console.log('initializeApp: user is signed OUT');
        resolve(null);
      }
    });
  });
}



@NgModule({
  declarations: [
    AppComponent,
    PersonViewComponent,
    PersonSearchComponent,
    PersonEditComponent,
    LandingComponent,
    DataSearchComponent,
    DataViewComponent,
    DataEditComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    NgbModule,
    HttpClientModule,
    CommonModule,
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: () => initializeApp,
      multi: true
    },
    {provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true},
    AuthenticationService,
    PersonService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
