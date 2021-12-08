import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {PersonSearchComponent} from './person/person-search/person-search.component';
import {PersonViewComponent} from './person/person-view/person-view.component';
import {PersonEditComponent} from './person/person-edit/person-edit.component';
import {LandingComponent} from './landing/landing.component';

const routes: Routes = [
  { path: 'person/search', component: PersonSearchComponent },
  { path: 'person/view/:id', component: PersonViewComponent },
  { path: 'person/edit/:id', component: PersonEditComponent },
  { path: '**', component: LandingComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
