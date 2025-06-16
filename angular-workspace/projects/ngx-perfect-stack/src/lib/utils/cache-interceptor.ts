import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import {Observable} from 'rxjs';

export class CacheInterceptor implements HttpInterceptor {

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    // Eventually we might design a way to have more control over this, but for now all API requests
    // need to have caching switched off so things like CloudFront don't cache our API request/responses
    const nextRequest = request.clone({
      headers: request.headers
        .set('Cache-Control', 'no-store, no-store, must-revalidate, max-age=0')
        .set('Pragma', 'no-cache')
        .set('Expires', '0'),
    });

    return next.handle(nextRequest);
  }


}
