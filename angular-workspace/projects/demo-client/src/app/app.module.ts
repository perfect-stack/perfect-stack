import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {NgxPerfectStackModule} from '../../../ngx-perfect-stack/src/lib/ngx-perfect-stack.module';
import { AddEventDialogComponent } from './pages/add-event-dialog/add-event-dialog.component';
import { AddLocationDialogComponent } from './pages/add-location-dialog/add-location-dialog.component';
import {ReactiveFormsModule} from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent,
    AddEventDialogComponent,
    AddLocationDialogComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgxPerfectStackModule,
    NgbModule,
    ReactiveFormsModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
