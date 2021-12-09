import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {PersonSearchComponent} from './person/person-search/person-search.component';
import {PersonViewComponent} from './person/person-view/person-view.component';
import {PersonEditComponent} from './person/person-edit/person-edit.component';
import {LandingComponent} from './landing/landing.component';
import {AppGuard} from './app-guard.service';

const routes: Routes = [
  { path: 'person/search', component: PersonSearchComponent, canActivate: [AppGuard] },
  { path: 'person/view/:id', component: PersonViewComponent, canActivate: [AppGuard] },
  { path: 'person/edit/:id', component: PersonEditComponent, canActivate: [AppGuard] },
  { path: '**', component: LandingComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
