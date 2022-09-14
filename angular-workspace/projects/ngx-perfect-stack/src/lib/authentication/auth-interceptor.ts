import {Injectable} from '@angular/core';
import {HttpErrorResponse, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {catchError, switchMap, throwError} from 'rxjs';
import {AuthenticationService} from './authentication.service';
import {ToastService} from '../utils/toasts/toast.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(protected readonly authenticationService: AuthenticationService,
              protected readonly toastService: ToastService) {}

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

        return next.handle(authReq).pipe(
          catchError((error: HttpErrorResponse) => {

            console.log('Application Intercepted HTTP error', error.error);
            let toastErrorMessage = '';
            const errorResponse = error.error;
            if(errorResponse) {
              if(errorResponse.error) {
                toastErrorMessage += errorResponse.error + ':';
              }

              if(errorResponse.message) {
                toastErrorMessage += ' ' + errorResponse.message
              }
            }

            if(toastErrorMessage) {
              console.error(toastErrorMessage, error);
              this.toastService.showError(toastErrorMessage, false);
            }

            return throwError('Application Intercepted HTTP Error');
          }));
      }));
    }
    else {
      return next.handle(req);
    }
  }

}
