import {Injectable} from '@angular/core';
import {HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {AngularFireAuth} from '@angular/fire/compat/auth';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  token: any;

  constructor(public auth: AngularFireAuth) {
    auth.idToken.subscribe((token) => this.token = token);
  }

  intercept(req: HttpRequest<any>, next: HttpHandler) {

    // Get the auth token from the service.
    //const authToken = this.auth.getAuthorizationToken();
    if(this.token) {
      const authToken = this.token;

      console.log(`Token: ${this.token}`);

      // Clone the request and replace the original headers with
      // cloned headers, updated with the authorization.
      // const authReq = req.clone({
      //   headers: req.headers.set('Authorization', authToken)
      // });

      // Clone the request and set the new header in one step.
      const authReq = req.clone({ setHeaders: { Authorization: authToken } });
      // send cloned request with header to the next handler.
      return next.handle(authReq);
    }
    else {
      console.log('No token is available!');
      // send cloned request with header to the next handler.
      return next.handle(req);
    }
  }
}
