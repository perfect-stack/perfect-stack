import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {PersonViewComponent} from './person/person-view/person-view.component';
import {PersonSearchComponent} from './person/person-search/person-search.component';
import {PersonEditComponent} from './person/person-edit/person-edit.component';
import {PersonService} from './person/person-service/person.service';
import {HttpClientModule} from '@angular/common/http';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';

@NgModule({
  declarations: [
    AppComponent,
    PersonViewComponent,
    PersonSearchComponent,
    PersonEditComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    NgbModule,
    HttpClientModule,
    CommonModule,
  ],
  providers: [PersonService],
  bootstrap: [AppComponent]
})
export class AppModule { }
