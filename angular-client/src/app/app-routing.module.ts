import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {PersonSearchComponent} from './person/person-search/person-search.component';
import {PersonViewComponent} from './person/person-view/person-view.component';
import {PersonEditComponent} from './person/person-edit/person-edit.component';
import {LandingComponent} from './landing/landing.component';
import {AppGuard} from './app-guard.service';
import {DataSearchComponent} from './data/data-search/data-search.component';
import {DataViewComponent} from './data/data-view/data-view.component';
import {DataEditComponent} from './data/data-edit/data-edit.component';

const routes: Routes = [
  { path: 'person/search', component: PersonSearchComponent, canActivate: [AppGuard] },
  { path: 'person/view/:id', component: PersonViewComponent, canActivate: [AppGuard] },
  { path: 'person/edit/:id', component: PersonEditComponent, canActivate: [AppGuard] },

  { path: 'data/:metaName/search', component: DataSearchComponent, canActivate: [AppGuard] },
  { path: 'data/:metaName/view/:id', component: DataViewComponent, canActivate: [AppGuard] },
  { path: 'data/:metaName/edit/:id', component: DataEditComponent, canActivate: [AppGuard] },

  { path: '**', component: LandingComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
