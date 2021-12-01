import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {PersonSearchComponent} from './person/person-search/person-search.component';

const routes: Routes = [
  { path: 'person-search', component: PersonSearchComponent },
  { path: '**', component: PersonSearchComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
