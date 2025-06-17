import { Component } from '@angular/core';
import {Router} from '@angular/router';

@Component({
    selector: 'app-landing-page',
    templateUrl: './landing-page.component.html',
    styleUrls: ['./landing-page.component.scss'],
    standalone: false
})
export class LandingPageComponent {

  constructor(protected readonly router: Router) {
  }
  onLogin() {
    this.router.navigate(['/data/Bird/search'])
  }
}
