import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LandingPageComponent} from './landing-page/landing-page.component';

const routes: Routes = [
  // If no other route found then it must be the Landing page
  { path: '**', component: LandingPageComponent}
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    RouterModule.forRoot([])
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
