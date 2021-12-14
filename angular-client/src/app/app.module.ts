import {APP_INITIALIZER, inject, Inject, INJECTOR, NgModule} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {NgbDateAdapter, NgbDropdown, NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {PersonViewComponent} from './person/person-view/person-view.component';
import {PersonSearchComponent} from './person/person-search/person-search.component';
import {PersonEditComponent} from './person/person-edit/person-edit.component';
import {PersonService} from './person/person-service/person.service';
import {HTTP_INTERCEPTORS, HttpClient, HttpClientModule} from '@angular/common/http';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {AuthInterceptor} from './auth-interceptor';
import {getAuth, onAuthStateChanged} from 'firebase/auth';
import getFirebase from '../firebase';
import { LandingComponent } from './landing/landing.component';
import {AuthenticationService} from './authentication/authentication.service';
import { DataSearchComponent } from './data/data-search/data-search.component';
import { DataViewComponent } from './data/data-view/data-view.component';
import {CustomAdapter, DataEditComponent} from './data/data-edit/data-edit.component';
import { DatePickerControlComponent } from './data/data-edit/form-controls/date-picker-control/date-picker-control.component';
import { TextFieldControlComponent } from './data/data-edit/form-controls/text-field-control/text-field-control.component';
import {MetaService} from './meta/service/meta.service';
import { MetaEntitySearchComponent } from './meta/entity/meta-entity-search/meta-entity-search.component';
import { MetaMenuEditComponent } from './meta/menu/meta-menu-edit/meta-menu-edit.component';


function initializeApp(metaService: MetaService) {
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
    DatePickerControlComponent,
    TextFieldControlComponent,
    MetaEntitySearchComponent,
    MetaMenuEditComponent,
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
    AuthenticationService,
    PersonService,
    MetaService,
    {
      provide: APP_INITIALIZER,
      useFactory: () => initializeApp,
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: () => inject(INJECTOR).get(MetaService).initMenu(),
      deps: [HttpClient, MetaService],
      multi: true
    },
    {provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true},
    {provide: NgbDateAdapter, useClass: CustomAdapter},
    NgbDropdown,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
