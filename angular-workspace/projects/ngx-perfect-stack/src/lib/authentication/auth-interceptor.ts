import {Injectable} from '@angular/core';
import { HttpContext, HttpContextToken, HttpErrorResponse, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import {catchError, throwError} from 'rxjs';
import {AuthenticationService} from './authentication.service';
import {ToastService} from '../utils/toasts/toast.service';

/**
 * Defines the operating modes for AuthInterceptor.
 */
export enum HttpInterceptorMode {
  /**
   * 1. Default: Injects the Authorization Bearer token header and wraps HTTP errors
   * with a global toast notification and a generic error throw.
   */
  Default = 'DEFAULT',

  /**
   * 2. Auth only: Injects the Authorization Bearer token header, but gets out of the way
   * for error handling. Raw HTTP errors propagate directly to the caller.
   */
  AuthOnly = 'AUTH_ONLY',

  /**
   * 3. Bypass Auth: Does NOT attach any Authorization Bearer token header, but still
   * wraps HTTP errors with global toast notification and generic error throw. Useful for
   * unauthenticated/public startup calls like initial menu loading.
   */
  BypassAuth = 'BYPASS_AUTH',

  /**
   * 4. Nothing / DIY: Completely bypasses this interceptor.
   * The caller is responsible for both authentication headers and error handling.
   */
  DIY = 'DIY',
}

/**
 * HttpContextToken used to control the interceptor behavior per-request.
 */
export const HTTP_INTERCEPTOR_MODE = new HttpContextToken<HttpInterceptorMode>(
  () => HttpInterceptorMode.Default
);

/**
 * Helper function to create an HttpContext configured for AuthOnly mode.
 */
export function withAuthOnly(): HttpContext {
  return new HttpContext().set(HTTP_INTERCEPTOR_MODE, HttpInterceptorMode.AuthOnly);
}

/**
 * Helper function to create an HttpContext configured for BypassAuth mode.
 */
export function withBypassAuth(): HttpContext {
  return new HttpContext().set(HTTP_INTERCEPTOR_MODE, HttpInterceptorMode.BypassAuth);
}

/**
 * Helper function to create an HttpContext configured for DIY mode.
 */
export function withDIY(): HttpContext {
  return new HttpContext().set(HTTP_INTERCEPTOR_MODE, HttpInterceptorMode.DIY);
}

/**
 * AuthInterceptor
 *
 * Handles Bearer token injection and global error notifications for outbound HTTP requests.
 * By default, this interceptor applies to all HTTP requests unless configured otherwise via `HttpContext`.
 *
 * ### Usage Examples in Client Services:
 *
 * 1. Default (Auth + Global Toast Error Handling):
 * ```typescript
 * this.http.get('/api/v1/birds');
 * ```
 *
 * 2. Auth Only (Auth token added, caller handles raw HTTP errors):
 * ```typescript
 * this.http.get('/api/v1/birds', {
 *   context: withAuthOnly()
 *   // OR: context: new HttpContext().set(HTTP_INTERCEPTOR_MODE, HttpInterceptorMode.AuthOnly)
 * }).subscribe({
 *   next: (data) => console.log(data),
 *   error: (err: HttpErrorResponse) => {
 *     // Handle specific status code (e.g., 404, 409) without generic interceptor toast
 *   }
 * });
 * ```
 *
 * 3. Bypass Auth (No Bearer token attached, global toast error handling retained):
 * ```typescript
 * this.http.get('/meta/menu', {
 *   context: withBypassAuth()
 *   // OR: context: new HttpContext().set(HTTP_INTERCEPTOR_MODE, HttpInterceptorMode.BypassAuth)
 * });
 * ```
 *
 * 4. DIY / Nothing (Interceptor completely bypasses request):
 * ```typescript
 * const token = this.authService.user$.getValue()?.getBearerToken();
 * const headers = new HttpHeaders({
 *   'Authorization': `Bearer ${token}`
 * });
 *
 * this.http.get('/api/external/data', {
 *   headers: headers,
 *   context: withDIY()
 *   // OR: context: new HttpContext().set(HTTP_INTERCEPTOR_MODE, HttpInterceptorMode.DIY)
 * });
 * ```
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(protected readonly authenticationService: AuthenticationService,
              protected readonly toastService: ToastService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const mode = req.context.get(HTTP_INTERCEPTOR_MODE);

    // 4. DIY / Nothing: completely bypass interceptor
    if (mode === HttpInterceptorMode.DIY) {
      return next.handle(req);
    }

    // Capture the stack trace synchronously BEFORE the async HTTP call.
    // This ensures you see the component/service that actually initiated the request.
    const callerStack = new Error('HTTP Request Origin').stack;

    // Determine request to forward (attach Bearer token unless BypassAuth is requested)
    let requestToForward = req;
    if(mode !== HttpInterceptorMode.BypassAuth && this.authenticationService.isLoggedIn && this.authenticationService.user$.getValue()) {
      const bearerToken = this.authenticationService.user$.getValue()?.getBearerToken();
      requestToForward = req.clone({
        headers: req.headers.set('Authorization', 'Bearer ' + bearerToken)
      });
    }

    // 2. AuthOnly: Attach token but bypass error handling / toasts
    if (mode === HttpInterceptorMode.AuthOnly) {
      return next.handle(requestToForward);
    }

    // 1. Default & 3. BypassAuth: pipe through global error toasts + generic error mapping
    return next.handle(requestToForward).pipe(
      catchError((error: HttpErrorResponse) => {

        console.log('Application Intercepted HTTP error', error.error);
        console.trace('Trace of interceptor execution at error site:');
        console.debug('Original request was initiated by:', callerStack);

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
          this.toastService.showError(toastErrorMessage, false);
        }

        return throwError(() => new Error('Application Intercepted HTTP Error'));
      })
    );
  }

}
