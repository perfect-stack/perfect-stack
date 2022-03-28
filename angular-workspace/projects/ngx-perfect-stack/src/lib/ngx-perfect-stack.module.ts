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
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import {BrowserModule} from '@angular/platform-browser';
import {AuthenticationService} from './authentication/authentication.service';
import {ClientConfigService} from './client/config/client-config.service';
import {initializeAuth} from './authentication/auth-initializer';
import {AuthGuard} from './authentication/auth-guard.service';

const routes: Routes = [
  { path: 'meta/menu/view', component: MetaMenuViewComponent, canActivate: [AuthGuard] },
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
  ],
  providers: [
    AuthenticationService,
    ClientConfigService,
    MetaMenuService,
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
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
//    AppRoutingModule,
    NgbModule,
    HttpClientModule,
    CommonModule,
    //EditorModule,
    //NgDragDropModule.forRoot(),
    RouterModule.forChild(routes),
    ReactiveFormsModule,
  ],
  exports: [
    NgxPerfectStackComponent
  ]
})
export class NgxPerfectStackModule { }
