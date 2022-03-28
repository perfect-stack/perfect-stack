import {APP_INITIALIZER, inject, INJECTOR, NgModule} from '@angular/core';
import { NgxPerfectStackComponent } from './ngx-perfect-stack.component';
import { ChildOneComponent } from './child-one/child-one.component';
import { ChildTwoComponent } from './child-two/child-two.component';
import {RouterModule, Routes} from '@angular/router';
import {MenuBarComponent} from './menu-bar/menu-bar.component';
import {MetaMenuViewComponent} from './meta/menu/meta-menu-view/meta-menu-view.component';
import {MenuItemViewComponent} from './meta/menu/meta-menu-view/menu-item-view/menu-item-view.component';
import {MenuItemEditComponent} from './meta/menu/meta-menu-view/menu-item-edit/menu-item-edit.component';
import {MenuHeaderViewComponent} from './meta/menu/meta-menu-view/menu-header-view/menu-header-view.component';
import {MetaMenuService} from './meta/menu/meta-menu-service/meta-menu.service';
import {NgbDateAdapter, NgbDropdown, NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HTTP_INTERCEPTORS, HttpClient, HttpClientModule} from '@angular/common/http';
import {BrowserModule} from '@angular/platform-browser';
import {AuthenticationService} from './authentication/authentication.service';
import {ClientConfigService} from './client/config/client-config.service';
import {initializeAuth} from './authentication/auth-initializer';
import {AuthGuard} from './authentication/auth-guard.service';
import {TemplateFormEditor} from './template/template-form-editor/template-form-editor.component';
import {CellViewComponent} from './template/template-form-editor/cell-view/cell-view.component';
import {TemplateControllerComponent} from './template/template-controller/template-controller.component';
import {
  TemplateOptionsModalComponent
} from './template/template-controller/template-options-modal/template-options-modal.component';
import {AttributePaletteComponent} from './template/attribute-palette/attribute-palette.component';
import {MetaPageService} from './meta/page/meta-page-service/meta-page.service';
import {MetaPageSearchComponent} from './meta/page/meta-page-search/meta-page-search.component';
import {MetaPageEditComponent} from './meta/page/meta-page-edit/meta-page-edit.component';
import {MetaEntityViewComponent} from './meta/entity/meta-entity-view/meta-entity-view.component';
import {MetaEntityService} from './meta/entity/meta-entity-service/meta-entity.service';
import {MetaEntitySearchComponent} from './meta/entity/meta-entity-search/meta-entity-search.component';
import {MetaEntityEditComponent} from './meta/entity/meta-entity-edit/meta-entity-edit.component';
import {
  RelationshipTypeEditComponent
} from './meta/entity/meta-entity-edit/relationship-type-edit/relationship-type-edit.component';
import {AttributeDeleteDialogComponent} from './meta/entity/attribute-delete-dialog/attribute-delete-dialog.component';
import {ToastService} from './utils/toast.service';
import {ValidationMessageComponent} from './utils/validation/validation-message/validation-message.component';
import {ToastsComponent} from './utils/toasts/toasts.component';
import {NgDragDropModule} from 'ng-drag-drop';
import {CellContainerComponent} from './data/data-edit/form-controls/cell-container/cell-container.component';
import {
  DatePickerControlComponent
} from './data/data-edit/form-controls/date-picker-control/date-picker-control.component';
import {
  ManyToOneControlComponent
} from './data/data-edit/form-controls/many-to-one-control/many-to-one-control.component';
import {
  OneToManyControlComponent
} from './data/data-edit/form-controls/one-to-many-control/one-to-many-control.component';
import {OneToOneControlComponent} from './data/data-edit/form-controls/one-to-one-control/one-to-one-control.component';
import {SelectControlComponent} from './data/data-edit/form-controls/select-control/select-control.component';
import {TextAreaControlComponent} from './data/data-edit/form-controls/text-area-control/text-area-control.component';
import {
  TextFieldControlComponent
} from './data/data-edit/form-controls/text-field-control/text-field-control.component';
import {AuthInterceptor} from './authentication/auth-interceptor';
import {CustomDateAdapterService} from './data/data-edit/form-controls/custom-date-adapter.service';
import {TemplateTableEditorComponent} from './template/template-table-editor/template-table-editor.component';
import {TableLayoutComponent} from './data/data-edit/table-layout/table-layout.component';
import {FormComponent} from './data/data-edit/form/form.component';
import {FormLayoutComponent} from './data/data-edit/form-layout/form-layout.component';
import {EditorModule} from '@tinymce/tinymce-angular';

const routes: Routes = [
  { path: 'meta/entity/search', component: MetaEntitySearchComponent, canActivate: [AuthGuard] },
  { path: 'meta/entity/view/:metaName', component: MetaEntityViewComponent, canActivate: [AuthGuard] },
  { path: 'meta/entity/edit/:metaName', component: MetaEntityEditComponent, canActivate: [AuthGuard] },

  { path: 'meta/menu/view', component: MetaMenuViewComponent, canActivate: [AuthGuard] },

  { path: 'meta/page/search', component: MetaPageSearchComponent, canActivate: [AuthGuard] },
  { path: 'meta/page/edit/:metaPageName', component: MetaPageEditComponent, canActivate: [AuthGuard] },
];

@NgModule({
  declarations: [
    NgxPerfectStackComponent,
    ChildOneComponent,
    ChildTwoComponent,
    MenuBarComponent,
    MetaMenuViewComponent,
    MenuItemViewComponent,
    MenuItemEditComponent,
    MenuHeaderViewComponent,
    AttributePaletteComponent,
    TemplateOptionsModalComponent,
    TemplateControllerComponent,
    CellViewComponent,
    TemplateFormEditor,
    TemplateTableEditorComponent,
    MetaPageSearchComponent,
    MetaPageEditComponent,
    MetaEntityViewComponent,
    MetaEntitySearchComponent,
    MetaEntityEditComponent,
    RelationshipTypeEditComponent,
    AttributeDeleteDialogComponent,
    ValidationMessageComponent,
    ToastsComponent,
    CellContainerComponent,
    DatePickerControlComponent,
    ManyToOneControlComponent,
    OneToManyControlComponent,
    OneToOneControlComponent,
    SelectControlComponent,
    TextAreaControlComponent,
    TextFieldControlComponent,
    TableLayoutComponent,
    FormComponent,
    FormLayoutComponent,
  ],
  providers: [
    AuthenticationService,
    ClientConfigService,
    MetaMenuService,
    MetaPageService,
    MetaEntityService,
    ToastService,
    CustomDateAdapterService,
    {
      provide: APP_INITIALIZER,
      useFactory: () => initializeAuth,
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: () => inject(INJECTOR).get(MetaMenuService).initMenu(),
      deps: [HttpClient, MetaMenuService],
      multi: true
    },
    {provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true},
    {provide: NgbDateAdapter, useClass: CustomDateAdapterService},
    NgbDropdown,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
//    AppRoutingModule,
    NgbModule,
    HttpClientModule,
    CommonModule,
    EditorModule,
    NgDragDropModule.forRoot(),
    RouterModule.forChild(routes),
    ReactiveFormsModule,
  ],
  exports: [
    NgxPerfectStackComponent
  ]
})
export class NgxPerfectStackModule { }
