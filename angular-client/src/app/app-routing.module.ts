import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {PersonSearchComponent} from './person/person-search/person-search.component';
import {PersonViewComponent} from './person/person-view/person-view.component';
import {PersonEditComponent} from './person/person-edit/person-edit.component';
import {LandingComponent} from './landing/landing.component';
import {AuthGuard} from './authentication/auth-guard.service';
import {DataSearchComponent} from './data/data-search/data-search.component';
import {DataEditComponent} from './data/data-edit/data-edit.component';
import {MetaEntitySearchComponent} from './meta/entity/meta-entity-search/meta-entity-search.component';
import {MetaEntityViewComponent} from './meta/entity/meta-entity-view/meta-entity-view.component';
import {MetaEntityEditComponent} from './meta/entity/meta-entity-edit/meta-entity-edit.component';
import {MetaMenuViewComponent} from './meta/menu/meta-menu-view/meta-menu-view.component';
import {MetaPageEditComponent} from './meta/page/meta-page-edit/meta-page-edit.component';
import {MetaPageSearchComponent} from './meta/page/meta-page-search/meta-page-search.component';
import {DataSearchEditComponent} from './data/data-search-edit/data-search-edit.component';

const routes: Routes = [
  { path: 'person/search', component: PersonSearchComponent, canActivate: [AuthGuard] },
  { path: 'person/view/:id', component: PersonViewComponent, canActivate: [AuthGuard] },
  { path: 'person/edit/:id', component: PersonEditComponent, canActivate: [AuthGuard] },

  { path: 'data/:metaName/search', component: DataSearchComponent, canActivate: [AuthGuard] },
  { path: 'data/:metaName/search_edit', component: DataSearchEditComponent, canActivate: [AuthGuard] },
  { path: 'data/:metaName/:mode/:id', component: DataEditComponent, canActivate: [AuthGuard] },

  { path: 'meta/entity/search', component: MetaEntitySearchComponent, canActivate: [AuthGuard] },
  { path: 'meta/entity/view/:metaName', component: MetaEntityViewComponent, canActivate: [AuthGuard] },
  { path: 'meta/entity/edit/:metaName', component: MetaEntityEditComponent, canActivate: [AuthGuard] },

  { path: 'meta/menu/view', component: MetaMenuViewComponent, canActivate: [AuthGuard] },

  { path: 'meta/page/search', component: MetaPageSearchComponent, canActivate: [AuthGuard] },
  { path: 'meta/page/edit/:metaPageName', component: MetaPageEditComponent, canActivate: [AuthGuard] },

  { path: '**', component: LandingComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
