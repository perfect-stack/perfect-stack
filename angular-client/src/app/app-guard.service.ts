import { Injectable } from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import { Observable } from 'rxjs';
import {AuthenticationService} from './authentication/authentication.service';

@Injectable({
  providedIn: 'root'
})
export class AppGuard implements CanActivate {

  constructor(protected readonly router: Router, protected readonly authenticationService: AuthenticationService) {
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    if(this.authenticationService.isLoggedIn) {
      return true;
    }
    else {
      // Store the attempted URL for redirecting
      this.authenticationService.redirectUrl = state.url;
      this.authenticationService.login();
      return this.router.navigate(['/']);
    }
  }

}
