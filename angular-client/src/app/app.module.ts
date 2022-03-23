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
import {CustomAdapter, DataEditComponent} from './data/data-edit/data-edit.component';
import { DatePickerControlComponent } from './data/data-edit/form-controls/date-picker-control/date-picker-control.component';
import { TextFieldControlComponent } from './data/data-edit/form-controls/text-field-control/text-field-control.component';
import { MetaEntitySearchComponent } from './meta/entity/meta-entity-search/meta-entity-search.component';
import { MetaEntityViewComponent } from './meta/entity/meta-entity-view/meta-entity-view.component';
import { MetaEntityEditComponent } from './meta/entity/meta-entity-edit/meta-entity-edit.component';
import { MetaMenuViewComponent } from './meta/menu/meta-menu-view/meta-menu-view.component';
import { MenuItemViewComponent } from './meta/menu/meta-menu-view/menu-item-view/menu-item-view.component';
import { MenuHeaderViewComponent } from './meta/menu/meta-menu-view/menu-header-view/menu-header-view.component';
import {MetaMenuService} from './meta/menu/meta-menu-service/meta-menu.service';
import { MenuItemEditComponent } from './meta/menu/meta-menu-view/menu-item-edit/menu-item-edit.component';
import { TemplateFormEditor } from './template/template-form-editor/template-form-editor.component';
import {NgDragDropModule} from 'ng-drag-drop';
import { CellViewComponent } from './template/template-form-editor/cell-view/cell-view.component';
import { MetaPageEditComponent } from './meta/page/meta-page-edit/meta-page-edit.component';
import { MetaPageSearchComponent } from './meta/page/meta-page-search/meta-page-search.component';
import { TemplateControllerComponent } from './template/template-controller/template-controller.component';
import { TemplateTableEditorComponent } from './template/template-table-editor/template-table-editor.component';
import { AttributePaletteComponent } from './template/attribute-palette/attribute-palette.component';
import { FormComponent } from './data/data-edit/form/form.component';
import { FormLayoutComponent } from './data/data-edit/form-layout/form-layout.component';
import { ToastsComponent } from './utils/toasts/toasts.component';
import {ClientConfigService} from './client/config/client-config.service';
import { OneToManyControlComponent } from './data/data-edit/form-controls/one-to-many-control/one-to-many-control.component';
import { TableLayoutComponent } from './data/data-edit/table-layout/table-layout.component';
import { CellContainerComponent } from './data/data-edit/form-controls/cell-container/cell-container.component';
import { ValidationMessageComponent } from './utils/validation/validation-message/validation-message.component';
import { OneToOneControlComponent } from './data/data-edit/form-controls/one-to-one-control/one-to-one-control.component';
import { TemplateOptionsModalComponent } from './template/template-controller/template-options-modal/template-options-modal.component';
import { RelationshipTypeEditComponent } from './meta/entity/meta-entity-edit/relationship-type-edit/relationship-type-edit.component';
import { ManyToOneControlComponent } from './data/data-edit/form-controls/many-to-one-control/many-to-one-control.component';
import { TextAreaControlComponent } from './data/data-edit/form-controls/text-area-control/text-area-control.component';
import { SelectControlComponent } from './data/data-edit/form-controls/select-control/select-control.component';
import {EditorModule, TINYMCE_SCRIPT_SRC} from '@tinymce/tinymce-angular';
import { DataSearchEditComponent } from './data/data-search-edit/data-search-edit.component';
import { RowViewComponent } from './data/data-search-edit/row-view/row-view.component';
import { RowEditComponent } from './data/data-search-edit/row-edit/row-edit.component';
import { AttributeDeleteDialogComponent } from './meta/entity/attribute-delete-dialog/attribute-delete-dialog.component';


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
    DataEditComponent,
    DatePickerControlComponent,
    TextFieldControlComponent,
    MetaEntitySearchComponent,
    MetaEntityViewComponent,
    MetaEntityEditComponent,
    MetaMenuViewComponent,
    MenuItemViewComponent,
    MenuHeaderViewComponent,
    MenuItemEditComponent,
    TemplateFormEditor,
    CellViewComponent,
    MetaPageEditComponent,
    MetaPageSearchComponent,
    TemplateControllerComponent,
    TemplateTableEditorComponent,
    AttributePaletteComponent,
    FormComponent,
    FormLayoutComponent,
    ToastsComponent,
    OneToManyControlComponent,
    TableLayoutComponent,
    CellContainerComponent,
    ValidationMessageComponent,
    OneToOneControlComponent,
    TemplateOptionsModalComponent,
    RelationshipTypeEditComponent,
    ManyToOneControlComponent,
    TextAreaControlComponent,
    SelectControlComponent,
    DataSearchEditComponent,
    RowViewComponent,
    RowEditComponent,
    AttributeDeleteDialogComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    NgbModule,
    HttpClientModule,
    CommonModule,
    EditorModule,
    NgDragDropModule.forRoot(),
  ],
  providers: [
    AuthenticationService,
    ClientConfigService,
    PersonService,
    MetaMenuService,
    {
      provide: APP_INITIALIZER,
      useFactory: () => initializeApp,
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: () => inject(INJECTOR).get(MetaMenuService).initMenu(),
      deps: [HttpClient, MetaMenuService],
      multi: true
    },
    {provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true},
    {provide: NgbDateAdapter, useClass: CustomAdapter},
    NgbDropdown,
    { provide: TINYMCE_SCRIPT_SRC, useValue: 'tinymce/tinymce.min.js' }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
