import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable} from 'rxjs';

export class CacheInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    // Eventually we might design a way to have more control over this, but for now all API requests
    // need to have caching switched off so things like CloudFront don't cache our API request/responses
    const authReq = req.clone({
      headers: req.headers.set('Cache-Control', 'no-store')
    });

    return next.handle(authReq);
  }


}
