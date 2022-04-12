import {Injectable} from '@angular/core';
import {HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {switchMap} from 'rxjs';
import {AuthenticationService} from './authentication.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(protected readonly authenticationService: AuthenticationService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {

    // WARNING: hack code here for dealing with loading menu when there
    // is no user logged in
    if(req.method === 'GET' && req.url.includes('menu')) {
      return next.handle(req);
    }

    if(this.authenticationService.isLoggedIn && this.authenticationService.user) {
      return this.authenticationService.user.getBearerToken().pipe(switchMap( (token) => {
        // Clone the request and replace the original headers with
        // cloned headers, updated with the authorization.
        const authReq = req.clone({
          headers: req.headers.set('Authorization', 'Bearer ' + token)
        });

        return next.handle(authReq);
      }));
    }
    else {
      return next.handle(req);
    }
  }

}
