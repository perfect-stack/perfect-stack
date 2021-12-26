import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {PersonSearchComponent} from './person/person-search/person-search.component';
import {PersonViewComponent} from './person/person-view/person-view.component';
import {PersonEditComponent} from './person/person-edit/person-edit.component';
import {LandingComponent} from './landing/landing.component';
import {AppGuard} from './app-guard.service';
import {DataSearchComponent} from './data/data-search/data-search.component';
import {DataEditComponent} from './data/data-edit/data-edit.component';
import {MetaEntitySearchComponent} from './meta/entity/meta-entity-search/meta-entity-search.component';
import {MetaEntityViewComponent} from './meta/entity/meta-entity-view/meta-entity-view.component';
import {MetaEntityEditComponent} from './meta/entity/meta-entity-edit/meta-entity-edit.component';
import {MetaMenuViewComponent} from './meta/menu/meta-menu-view/meta-menu-view.component';
import {TemplateEditComponent} from './template/template-edit/template-edit.component';

const routes: Routes = [
  { path: 'person/search', component: PersonSearchComponent, canActivate: [AppGuard] },
  { path: 'person/view/:id', component: PersonViewComponent, canActivate: [AppGuard] },
  { path: 'person/edit/:id', component: PersonEditComponent, canActivate: [AppGuard] },

  { path: 'data/:metaName/search', component: DataSearchComponent, canActivate: [AppGuard] },
  { path: 'data/:metaName/:mode/:id', component: DataEditComponent, canActivate: [AppGuard] },
  { path: 'data/:metaName/:mode/:id', component: DataEditComponent, canActivate: [AppGuard] },

  { path: 'meta/entity/search', component: MetaEntitySearchComponent, canActivate: [AppGuard] },
  { path: 'meta/entity/view/:metaName', component: MetaEntityViewComponent, canActivate: [AppGuard] },
  { path: 'meta/entity/edit/:metaName', component: MetaEntityEditComponent, canActivate: [AppGuard] },

  { path: 'meta/menu/view', component: MetaMenuViewComponent, canActivate: [AppGuard] },

  { path: 'meta/template/edit', component: TemplateEditComponent, canActivate: [AppGuard] },

  { path: '**', component: LandingComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
