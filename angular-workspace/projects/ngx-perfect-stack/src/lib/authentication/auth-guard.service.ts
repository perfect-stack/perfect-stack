import { Injectable } from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import { Observable } from 'rxjs';
import {AuthenticationService} from './authentication.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(protected readonly router: Router,
              protected readonly authenticationService: AuthenticationService) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    if(this.authenticationService.isLoggedIn) {
      console.log(`canActivate: TRUE ${state.url}`);
      return true;
    }
    else {
      // Store the attempted URL for redirecting
      this.authenticationService.redirectUrl = state.url;
      console.log(`canActivate: FALSE ${state.url}`);
      this.authenticationService.login();
      return this.router.navigate(['/']);
    }
  }

}