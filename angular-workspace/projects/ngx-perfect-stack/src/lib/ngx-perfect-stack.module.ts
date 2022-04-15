import {APP_INITIALIZER, inject, INJECTOR, ModuleWithProviders, NgModule} from '@angular/core';
import { NgxPerfectStackComponent } from './ngx-perfect-stack.component';
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
import {EditorModule, TINYMCE_SCRIPT_SRC} from '@tinymce/tinymce-angular';
import {DataViewComponent} from './data/data-view/data-view.component';
import {DataSearchEditComponent} from './data/data-search-edit/data-search-edit.component';
import {RowViewComponent} from './data/data-search-edit/row-view/row-view.component';
import {RowEditComponent} from './data/data-search-edit/row-edit/row-edit.component';
import {DataSearchComponent} from './data/data-search/data-search.component';
import {DataEditComponent} from './data/data-edit/data-edit.component';
import {LandingComponent} from './landing/landing.component';
import { ChildFormLayoutComponent } from './data/data-edit/form-controls/one-to-one-control/child-form-layout/child-form-layout.component';
import { ChildCellContainerComponent } from './data/data-edit/form-controls/one-to-one-control/child-form-layout/child-cell-container/child-cell-container.component';
import { ChildTemplateControllerComponent } from './template/template-form-editor/cell-view/child-template-controller/child-template-controller.component';
import { TemplateOptionsPanelComponent } from './template/template-controller/template-options-panel/template-options-panel.component';
import {
  TemplateOptionsModalComponent
} from './template/template-controller/template-options-panel/template-options-modal/template-options-modal.component';
import { ChildTemplateFormEditorComponent } from './template/template-form-editor/cell-view/child-template-controller/child-template-form-editor/child-template-form-editor.component';
import { ChildCellViewComponent } from './template/template-form-editor/cell-view/child-template-controller/child-template-form-editor/child-cell-view/child-cell-view.component';
import { LoginCallbackComponent } from './authentication/login-callback/login-callback.component';
import { SessionTimeOutComponent } from './authentication/session-time-out/session-time-out.component';
import { MessageDialogComponent } from './utils/message-dialog/message-dialog.component';
import { LoginButtonComponent } from './menu-bar/login-button/login-button.component';
import { ControllerComponent } from './data/controller/controller.component';
import { LayoutComponent } from './data/controller/layout/layout.component';
import { CellComponent } from './data/controller/layout/cell/cell.component';
import { NewTextFieldControlComponent } from './data/controller/layout/cell/control/new-text-field-control/new-text-field-control.component';
import { NewOneToOneControlComponent } from './data/controller/layout/cell/control/new-one-to-one-control/new-one-to-one-control.component';
import { NewFormLayoutComponent } from './data/controller/layout/new-form-layout/new-form-layout.component';
import { NewTableLayoutComponent } from './data/controller/layout/new-table-layout/new-table-layout.component';
import { LabelComponent } from './data/controller/layout/label/label.component';
import { NewOneToManyControlComponent } from './data/controller/layout/cell/control/new-one-to-many-control/new-one-to-many-control.component';

const routes: Routes = [
  { path: 'data/:metaName/search', component: DataSearchComponent, canActivate: [AuthGuard] },
  { path: 'data/:metaName/search_edit', component: DataSearchEditComponent, canActivate: [AuthGuard] },
  { path: 'data/:metaName/:mode/:id', component: DataEditComponent, canActivate: [AuthGuard] },

  { path: 'meta/entity/search', component: MetaEntitySearchComponent, canActivate: [AuthGuard] },
  { path: 'meta/entity/view/:metaName', component: MetaEntityViewComponent, canActivate: [AuthGuard] },
  { path: 'meta/entity/edit/:metaName', component: MetaEntityEditComponent, canActivate: [AuthGuard] },

  { path: 'meta/menu/view', component: MetaMenuViewComponent, canActivate: [AuthGuard] },

  { path: 'meta/page/search', component: MetaPageSearchComponent, canActivate: [AuthGuard] },
  { path: 'meta/page/edit/:metaPageName', component: MetaPageEditComponent, canActivate: [AuthGuard] },

  // No AuthGuard on these
  { path: 'login-callback', component: LoginCallbackComponent},
  { path: 'session-timeout', component: SessionTimeOutComponent},

  // Just for Controller development purposes
  { path: 'controller', component: ControllerComponent}
];

@NgModule({
  declarations: [
    NgxPerfectStackComponent,
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
    DataViewComponent,
    DataSearchEditComponent,
    RowViewComponent,
    RowEditComponent,
    DataSearchComponent,
    DataEditComponent,
    LandingComponent,
    ChildFormLayoutComponent,
    ChildCellContainerComponent,
    ChildTemplateControllerComponent,
    TemplateOptionsPanelComponent,
    ChildTemplateFormEditorComponent,
    ChildCellViewComponent,
    LoginCallbackComponent,
    SessionTimeOutComponent,
    MessageDialogComponent,
    LoginButtonComponent,
    ControllerComponent,
    LayoutComponent,
    CellComponent,
    NewTextFieldControlComponent,
    NewOneToOneControlComponent,
    NewFormLayoutComponent,
    NewTableLayoutComponent,
    LabelComponent,
    NewOneToManyControlComponent,
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
    {provide: TINYMCE_SCRIPT_SRC, useValue: 'tinymce/tinymce.min.js'},
    NgbDropdown,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    HttpClientModule,
    CommonModule,
    EditorModule,
    NgDragDropModule.forRoot(),
    RouterModule.forChild(routes),
    ReactiveFormsModule,
  ],
  exports: [
    NgxPerfectStackComponent,
    ToastsComponent,
  ]
})
export class NgxPerfectStackModule {}
