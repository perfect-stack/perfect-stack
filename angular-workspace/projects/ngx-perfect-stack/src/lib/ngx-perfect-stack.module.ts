import { NgModule } from '@angular/core';
import { NgxPerfectStackComponent } from './ngx-perfect-stack.component';
import { ChildOneComponent } from './child-one/child-one.component';
import { ChildTwoComponent } from './child-two/child-two.component';
import {RouterModule, Routes} from '@angular/router';

const routes: Routes = [
  { path: 'child-one', component: ChildOneComponent},
  { path: 'child-two', component: ChildTwoComponent},
];

@NgModule({
  declarations: [
    NgxPerfectStackComponent,
    ChildOneComponent,
    ChildTwoComponent
  ],
  imports: [
    RouterModule.forRoot(routes),
  ],
  exports: [
    NgxPerfectStackComponent
  ]
})
export class NgxPerfectStackModule { }
