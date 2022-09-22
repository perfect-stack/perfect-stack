import {APP_INITIALIZER, inject, INJECTOR, NgModule} from '@angular/core';
import { NgxPerfectStackComponent } from './ngx-perfect-stack.component';
import {RouterModule, Routes} from '@angular/router';
import {MenuBarComponent} from './menu-bar/menu-bar.component';
import {MetaMenuViewComponent} from './meta/menu/meta-menu-view/meta-menu-view.component';
import {MenuItemViewComponent} from './meta/menu/meta-menu-view/menu-item-view/menu-item-view.component';
import {MenuItemEditComponent} from './meta/menu/meta-menu-view/menu-item-edit/menu-item-edit.component';
import {MenuHeaderViewComponent} from './meta/menu/meta-menu-view/menu-header-view/menu-header-view.component';
import {MetaMenuService} from './meta/menu/meta-menu-service/meta-menu.service';
import {NgbDateAdapter, NgbDateParserFormatter, NgbDropdown, NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HTTP_INTERCEPTORS, HttpClient, HttpClientModule} from '@angular/common/http';
import {BrowserModule} from '@angular/platform-browser';
import {AuthenticationService} from './authentication/authentication.service';
import {ClientConfigService} from './client/config/client-config.service';
import {AuthGuard} from './authentication/auth-guard.service';
import {
  CellViewComponent,
  TemplateControllerComponent,
  TemplateFormEditor, TemplateHeaderEditorComponent
} from './template/template-controller/template-controller.component';
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
import {ToastService} from './utils/toasts/toast.service';
import {ValidationMessageComponent} from './utils/validation/validation-message/validation-message.component';
import {ToastsComponent} from './utils/toasts/toasts.component';
import {
  DatePickerControlComponent
} from './data/controller/layout/controls/date-picker-control/date-picker-control.component';
import {
  ManyToOneControlComponent
} from './data/controller/layout/controls/many-to-one-control/many-to-one-control.component';
import {SelectControlComponent} from './data/controller/layout/controls/select-control/select-control.component';
import {TextAreaControlComponent} from './data/controller/layout/controls/text-area-control/text-area-control.component';
import {AuthInterceptor} from './authentication/auth-interceptor';
import {CustomDateAdapterService} from './data/controller/layout/controls/date-picker-control/custom-date-adapter.service';
import {EditorModule, TINYMCE_SCRIPT_SRC} from '@tinymce/tinymce-angular';
import {DataSearchEditComponent} from './data/data-search-edit/data-search-edit.component';
import {RowViewComponent} from './data/data-search-edit/row-view/row-view.component';
import {RowEditComponent} from './data/data-search-edit/row-edit/row-edit.component';
import {DataSearchComponent} from './data/data-search/data-search.component';
import {DataEditComponent} from './data/data-edit/data-edit.component';
import {LandingComponent} from './landing/landing.component';
import { TemplateOptionsPanelComponent } from './template/template-controller/template-options-panel/template-options-panel.component';
import {
  TemplateOptionsModalComponent
} from './template/template-controller/template-options-panel/template-options-modal/template-options-modal.component';
import { LoginCallbackComponent } from './authentication/login-callback/login-callback.component';
import { SessionTimeOutComponent } from './authentication/session-time-out/session-time-out.component';
import { MessageDialogComponent } from './utils/message-dialog/message-dialog.component';
import { LoginButtonComponent } from './menu-bar/login-button/login-button.component';
import { ControllerComponent } from './data/controller/controller.component';
import {
  CellComponent,
  LayoutComponent,
  FormLayoutComponent,
  OneToManyControlComponent,
  OneToOneControlComponent,
  TableLayoutComponent,
  CardLayoutComponent,
  OneToPolyControlComponent,
  SpyControlComponent,
  ButtonTabsToolComponent,
  ToolViewComponent, HeaderLayoutComponent, TabToolComponent
} from './data/controller/layout/layout.component';
import { TextFieldControlComponent } from './data/controller/layout/controls/text-field-control/text-field-control.component';
import { LabelComponent } from './data/controller/layout/controls/label/label.component';
import {CacheInterceptor} from './utils/cache-interceptor';
import { OneToPolyEditComponent } from './meta/entity/meta-entity-edit/one-to-poly-edit/one-to-poly-edit.component';
import { CardItemDialogComponent } from './data/controller/layout/controls/card-item-dialog/card-item-dialog.component';
import {LoadingBarHttpClientModule} from '@ngx-loading-bar/http-client';
import { VersionComponent } from './meta/version/version.component';
import { EnumeratonEditComponent } from './meta/entity/meta-entity-edit/enumeraton-edit/enumeraton-edit.component';
import { EnumerationControlComponent } from './data/controller/layout/controls/enumeration-control/enumeration-control.component';
import { SelectTwoControlComponent } from './data/controller/layout/controls/select-two-control/select-two-control.component';
import { AuditViewComponent } from './audit/audit-view/audit-view.component';
import { NewYorkLayoutStyleComponent } from './data/data-edit/new-york-layout-style/new-york-layout-style.component';
import { ParisLayoutStyleComponent } from './data/data-edit/paris-layout-style/paris-layout-style.component';
import { ExpressionControlComponent } from './data/controller/layout/controls/expression-control/expression-control.component';
import {
  CustomDateParserFormatter
} from './data/controller/layout/controls/date-picker-control/custom-date-parser-formatter';
import { StockholmLayoutStyleComponent } from './data/data-edit/stockholm-layout-style/stockholm-layout-style.component';
import {CellSettingsComponent} from './template/template-controller/cell-settings/cell-settings.component';
import {
  TemplateTableEditorComponent
} from './template/template-controller/template-table-editor/template-table-editor.component';
import { DataQueryMapComponent } from './meta/page/meta-page-edit/data-query-map/data-query-map.component';
import { StaticImageControlComponent } from './data/controller/layout/controls/static-image-control/static-image-control.component';
import { DraggableDirective } from './utils/dragdrop/draggable.directive';
import { DropzoneDirective } from './utils/dragdrop/dropzone.directive';
import { ToolPaletteComponent } from './template/tool-palette/tool-palette.component';
import { ToolDropZoneComponent } from './template/template-controller/tool-drop-zone/tool-drop-zone.component';
import {ButtonToolComponent} from './data/controller/layout/tool-view/button-tool/button-tool.component';
import {ImageToolComponent} from './data/controller/layout/tool-view/image-tool/image-tool.component';
import { PropertySheetComponent } from './template/property-sheet/property-sheet.component';
import { VeniceLayoutStyleComponent } from './data/data-edit/venice-layout-style/venice-layout-style.component';
import { TextToolComponent } from './data/controller/layout/tool-view/text-tool/text-tool.component';
import { IconToolComponent } from './data/controller/layout/tool-view/icon-tool/icon-tool.component';
import { DateTimeControlComponent } from './data/controller/layout/controls/date-time-control/date-time-control.component';
import { TimeControlComponent } from './data/controller/layout/controls/time-control/time-control.component';
import { TileButtonPanelComponent } from './utils/tile-button-panel/tile-button-panel.component';
import { BooleanCheckBoxControlComponent } from './data/controller/layout/controls/boolean-check-box-control/boolean-check-box-control.component';
import { DecimalNumberDirective } from './utils/decimal-number.directive';
import { SelectTestPageComponent } from './select-test-page/select-test-page.component';
import { BadgeListComponent } from './data/controller/layout/controls/badge-list/badge-list.component';
import { ButtonGroupToolComponent } from './data/controller/layout/tool-view/button-group-tool/button-group-tool.component';
import { MapTestPageComponent } from './map-test-page/map-test-page.component';
import {LeafletModule} from '@asymmetrik/ngx-leaflet';
import { MapToolComponent } from './data/controller/layout/tool-view/map-tool/map-tool.component';
import { LinkToolComponent } from './data/controller/layout/tool-view/link-tool/link-tool.component';
import { RuleEditDialogComponent } from './meta/entity/meta-entity-edit/rule-edit-dialog/rule-edit-dialog.component';
import { ValidationResultLabelComponent } from './data/controller/layout/controls/validation-result-label/validation-result-label.component';
import { FlexibleDateTimeControlComponent } from './data/controller/layout/controls/flexible-date-time-control/flexible-date-time-control.component';
import { LastSignInToolComponent } from './data/controller/layout/tool-view/last-sign-in-tool/last-sign-in-tool.component';
import { PageTitleToolComponent } from './data/controller/layout/tool-view/page-title-tool/page-title-tool.component';
import { PaginateToolComponent } from './data/controller/layout/tool-view/paginate-tool/paginate-tool.component';
import { ControllerListComponent } from './meta/page/meta-page-edit/controller-list/controller-list.component';
import {SearchControllerService} from './data/controller/search-controller.service';
import {STANDARD_CONTROLLERS, standardControllers} from './data/controller/standard-controllers';
import { MetaRoleSearchComponent } from './meta/role/meta-role-search/meta-role-search.component';
import { MetaRoleEditComponent } from './meta/role/meta-role-edit/meta-role-edit.component';
import {MetaRoleService} from './meta/role/meta-role-service/meta-role.service';
import { PermissionCheckComponent } from './data/controller/layout/permission-check/permission-check.component';
import { AuthorizationErrorComponent } from './authentication/authorization-error/authorization-error.component';
import { LinkListControlComponent } from './data/controller/layout/controls/link-list-control/link-list-control.component';
import { OneToManyChoiceDialogComponent } from './template/template-controller/one-to-many-choice-dialog/one-to-many-choice-dialog.component';

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

  { path: 'meta/role/search', component: MetaRoleSearchComponent, canActivate: [AuthGuard] },
  { path: 'meta/role/edit/:metaRoleName', component: MetaRoleEditComponent, canActivate: [AuthGuard] },

  { path: 'meta/version', component: VersionComponent, canActivate: [AuthGuard] },

  // No AuthGuard on these
  { path: 'login-callback', component: LoginCallbackComponent},
  { path: 'session-timeout', component: SessionTimeOutComponent},
  { path: 'authorization-error', component: AuthorizationErrorComponent},

  // Just for Controller development purposes
  { path: 'controller', component: ControllerComponent},

  // Just for Testing Components
  { path: 'select-test', component: SelectTestPageComponent},
  { path: 'map-test', component: MapTestPageComponent}
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
    DatePickerControlComponent,
    ManyToOneControlComponent,
    SelectControlComponent,
    TextAreaControlComponent,
    DataSearchEditComponent,
    RowViewComponent,
    RowEditComponent,
    DataSearchComponent,
    DataEditComponent,
    LandingComponent,
    TemplateOptionsPanelComponent,
    LoginCallbackComponent,
    SessionTimeOutComponent,
    MessageDialogComponent,
    LoginButtonComponent,
    ControllerComponent,
    LayoutComponent,
    CellComponent,
    TextFieldControlComponent,
    OneToOneControlComponent,
    FormLayoutComponent,
    TableLayoutComponent,
    LabelComponent,
    OneToManyControlComponent,
    CardLayoutComponent,
    OneToPolyEditComponent,
    OneToPolyControlComponent,
    CardItemDialogComponent,
    VersionComponent,
    EnumeratonEditComponent,
    EnumerationControlComponent,
    SelectTwoControlComponent,
    CellSettingsComponent,
    AuditViewComponent,
    NewYorkLayoutStyleComponent,
    ParisLayoutStyleComponent,
    ExpressionControlComponent,
    StockholmLayoutStyleComponent,
    DataQueryMapComponent,
    StaticImageControlComponent,
    DraggableDirective,
    DropzoneDirective,
    ToolPaletteComponent,
    ToolDropZoneComponent,
    ButtonToolComponent,
    ImageToolComponent,
    ToolViewComponent,
    PropertySheetComponent,
    VeniceLayoutStyleComponent,
    TextToolComponent,
    IconToolComponent,
    DateTimeControlComponent,
    TimeControlComponent,
    TileButtonPanelComponent,
    BooleanCheckBoxControlComponent,
    DecimalNumberDirective,
    SelectTestPageComponent,
    BadgeListComponent,
    ButtonGroupToolComponent,
    ButtonTabsToolComponent,
    SpyControlComponent,
    MapTestPageComponent,
    MapToolComponent,
    LinkToolComponent,
    RuleEditDialogComponent,
    ValidationResultLabelComponent,
    FlexibleDateTimeControlComponent,
    TemplateHeaderEditorComponent,
    HeaderLayoutComponent,
    LastSignInToolComponent,
    PageTitleToolComponent,
    TabToolComponent,
    PaginateToolComponent,
    ControllerListComponent,
    MetaRoleSearchComponent,
    MetaRoleEditComponent,
    PermissionCheckComponent,
    AuthorizationErrorComponent,
    LinkListControlComponent,
    OneToManyChoiceDialogComponent
  ],
  providers: [
    AuthenticationService,
    ClientConfigService,
    MetaRoleService,
    MetaMenuService,
    MetaPageService,
    MetaEntityService,
    ToastService,
    CustomDateAdapterService,
    CustomDateParserFormatter,
    SearchControllerService,
    {provide: 'SearchController', useExisting: SearchControllerService},
    {provide: STANDARD_CONTROLLERS, useValue: standardControllers},
    {provide: APP_INITIALIZER, useFactory: () => inject(INJECTOR).get(MetaMenuService).initMenu(), deps: [HttpClient, MetaMenuService], multi: true},
    {provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true},
    {provide: HTTP_INTERCEPTORS, useClass: CacheInterceptor, multi: true},
    {provide: NgbDateAdapter, useClass: CustomDateAdapterService},
    {provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter},
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
    LeafletModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    LoadingBarHttpClientModule,
  ],
  exports: [
    NgxPerfectStackComponent,
    ToastsComponent,
    TileButtonPanelComponent,
    LayoutComponent,
  ]
})
export class NgxPerfectStackModule {}
