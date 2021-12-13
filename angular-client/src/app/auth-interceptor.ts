import {Injectable} from '@angular/core';
import {HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {getAuth} from 'firebase/auth';
import {from, switchMap} from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler) {

    if(req.url.includes('menu')) {
      return next.handle(req);
    }

    const auth = getAuth();
    if(auth.currentUser) {
      const obs = from(auth.currentUser.getIdToken());
      return obs.pipe(switchMap((token) => {

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
