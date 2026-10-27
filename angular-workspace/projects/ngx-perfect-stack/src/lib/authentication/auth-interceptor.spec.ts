import { TestBed } from '@angular/core/testing';
import { HttpClient, HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthInterceptor, withAuthOnly, withBypassAuth, withDIY } from './auth-interceptor';
import { AuthenticationService } from './authentication.service';
import { ToastService } from '../utils/toasts/toast.service';
import { of } from 'rxjs';

describe('AuthInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let mockAuthService: any;
  let mockToastService: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    mockAuthService = {
      isLoggedIn: true,
      getBearerToken: jasmine.createSpy('getBearerToken').and.returnValue(of('test-token-123')),
    };

    mockToastService = jasmine.createSpyObj('ToastService', ['showError']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        { provide: AuthenticationService, useValue: mockAuthService },
        { provide: ToastService, useValue: mockToastService },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should inject Authorization Bearer header using getBearerToken for default authenticated request', () => {
    http.get('/api/v1/test').subscribe();

    const req = httpMock.expectOne('/api/v1/test');
    expect(req.request.headers.has('Authorization')).toBeTrue();
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token-123');
    expect(mockAuthService.getBearerToken).toHaveBeenCalled();
    req.flush({});
  });

  it('should not inject Authorization header when BypassAuth context is set', () => {
    http.get('/meta/menu', { context: withBypassAuth() }).subscribe();

    const req = httpMock.expectOne('/meta/menu');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    expect(mockAuthService.getBearerToken).not.toHaveBeenCalled();
    req.flush({});
  });

  it('should not inject Authorization header when user is not logged in', () => {
    mockAuthService.isLoggedIn = false;

    http.get('/api/v1/public').subscribe();

    const req = httpMock.expectOne('/api/v1/public');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    expect(mockAuthService.getBearerToken).not.toHaveBeenCalled();
    req.flush({});
  });

  it('should bypass interceptor completely when DIY mode is set', () => {
    http.get('/external/api', { context: withDIY() }).subscribe();

    const req = httpMock.expectOne('/external/api');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    expect(mockAuthService.getBearerToken).not.toHaveBeenCalled();
    req.flush({});
  });

  it('should inject token but not toast error when AuthOnly mode is set and request fails', () => {
    http.get('/api/v1/custom-error', { context: withAuthOnly() }).subscribe({
      next: () => fail('Should have failed'),
      error: (err) => {
        expect(err.status).toBe(404);
      },
    });

    const req = httpMock.expectOne('/api/v1/custom-error');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token-123');
    req.flush({ error: 'Not Found', message: 'Resource not found' }, { status: 404, statusText: 'Not Found' });

    expect(mockToastService.showError).not.toHaveBeenCalled();
  });

  it('should show toast error for default mode on failure', () => {
    http.get('/api/v1/fail').subscribe({
      next: () => fail('Should have failed'),
      error: (err) => {
        expect(err.message).toBe('Application Intercepted HTTP Error');
      },
    });

    const req = httpMock.expectOne('/api/v1/fail');
    req.flush({ error: 'DatabaseError', message: 'Something went wrong' }, { status: 500, statusText: 'Server Error' });

    expect(mockToastService.showError).toHaveBeenCalledWith('DatabaseError: Something went wrong', false);
  });
});
