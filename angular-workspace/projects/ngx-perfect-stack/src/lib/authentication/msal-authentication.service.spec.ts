import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { AccountInfo, AuthenticationResult, EventMessage, EventType, InteractionStatus } from '@azure/msal-browser';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { MsalAuthenticationService } from './msal-authentication.service';
import { NgxPerfectStackConfig, STACK_CONFIG } from '../ngx-perfect-stack-config';
import { nativeJs, ZoneId, ZonedDateTime } from '@js-joda/core';

describe('MsalAuthenticationService', () => {
  let service: MsalAuthenticationService;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockMsalService: any;
  let inProgressSubject: BehaviorSubject<InteractionStatus>;
  let msalSubject: Subject<EventMessage>;

  const mockConfig: NgxPerfectStackConfig = {
    authenticationProvider: 'MSAL',
    msalClientId: 'test-client-id',
    msalAuthority: 'https://login.microsoftonline.com/test-tenant',
    msalRedirectUri: 'http://localhost:4200/login-callback',
  } as any;

  const createMockAccount = (expSecondsFromNow: number): AccountInfo => {
    const exp = Math.floor(Date.now() / 1000) + expSecondsFromNow;
    return {
      homeAccountId: 'home-123',
      environment: 'login.windows.net',
      tenantId: 'tenant-123',
      username: 'user@example.com',
      localAccountId: 'local-123',
      name: 'Test User',
      idToken: 'initial-id-token',
      idTokenClaims: {
        exp: exp,
        roles: ['User', 'Admin'],
        sub: 'sub-123',
      },
    };
  };

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();

    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);
    inProgressSubject = new BehaviorSubject<InteractionStatus>(InteractionStatus.None);
    msalSubject = new Subject<EventMessage>();

    mockMsalService = {
      handleRedirectObservable: jasmine.createSpy('handleRedirectObservable').and.returnValue(of(null)),
      loginRedirect: jasmine.createSpy('loginRedirect'),
      instance: {
        getActiveAccount: jasmine.createSpy('getActiveAccount'),
        setActiveAccount: jasmine.createSpy('setActiveAccount'),
        getAllAccounts: jasmine.createSpy('getAllAccounts').and.returnValue([]),
        acquireTokenSilent: jasmine.createSpy('acquireTokenSilent'),
      },
    };

    TestBed.configureTestingModule({
      providers: [
        MsalAuthenticationService,
        { provide: Router, useValue: mockRouter },
        { provide: MsalService, useValue: mockMsalService },
        {
          provide: MsalBroadcastService,
          useValue: {
            inProgress$: inProgressSubject.asObservable(),
            msalSubject$: msalSubject.asObservable(),
          },
        },
        { provide: STACK_CONFIG, useValue: mockConfig },
      ],
    });

    service = TestBed.inject(MsalAuthenticationService);
  });

  afterEach(() => {
    service.ngOnDestroy();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('should initialize and check active account', () => {
    const account = createMockAccount(3600);
    mockMsalService.instance.getActiveAccount.and.returnValue(account);

    service.checkAndSetActiveAccount();

    expect(service.isLoggedIn).toBeTrue();
    expect(service.user$.getValue()).not.toBeNull();
    expect(service.user$.getValue()?.getBearerToken()).toBe('initial-id-token');
  });

  describe('getRefreshTokenExpiry', () => {
    it('should find refresh token with expiresOn in sessionStorage', () => {
      const futureSeconds = Math.floor(Date.now() / 1000) + 86400; // 24 hours
      const rtEntity = {
        credentialType: 'RefreshToken',
        homeAccountId: 'home-123',
        clientId: 'test-client-id',
        expiresOn: String(futureSeconds),
      };
      sessionStorage.setItem('msal.1.0.home-123.refreshtoken.test-client-id', JSON.stringify(rtEntity));

      const account = createMockAccount(3600);
      const expiry = service.getRefreshTokenExpiry(account);

      expect(expiry).not.toBeNull();
      const expectedTime = ZonedDateTime.from(nativeJs(new Date(futureSeconds * 1000)));
      expect(expiry?.toEpochSecond()).toBe(expectedTime.toEpochSecond());
    });

    it('should calculate refresh token expiry from lastUpdatedAt if expiresOn is missing', () => {
      const nowMs = Date.now();
      const rtEntity = {
        credentialType: 'RefreshToken',
        homeAccountId: 'home-123',
        clientId: 'test-client-id',
        lastUpdatedAt: String(nowMs),
      };
      localStorage.setItem('msal.1.0.home-123.refreshtoken.test-client-id', JSON.stringify(rtEntity));

      const account = createMockAccount(3600);
      const expiry = service.getRefreshTokenExpiry(account);

      expect(expiry).not.toBeNull();
      const expectedExpMs = nowMs + 24 * 60 * 60 * 1000;
      const expectedTime = ZonedDateTime.from(nativeJs(new Date(expectedExpMs)));
      expect(expiry?.toEpochSecond()).toBe(expectedTime.toEpochSecond());
    });

    it('should return null when no matching refresh token exists', () => {
      const account = createMockAccount(3600);
      const expiry = service.getRefreshTokenExpiry(account);
      expect(expiry).toBeNull();
    });
  });

  describe('createUserFromMsalAccount', () => {
    it('should use Refresh Token expiry as session expiryTime, not the 60m ID token expiry', () => {
      const rtFutureSeconds = Math.floor(Date.now() / 1000) + 86400; // 24 hours
      const rtEntity = {
        credentialType: 'RefreshToken',
        homeAccountId: 'home-123',
        clientId: 'test-client-id',
        expiresOn: String(rtFutureSeconds),
      };
      sessionStorage.setItem('msal.1.0.home-123.refreshtoken.test-client-id', JSON.stringify(rtEntity));

      // ID token expires in 1 hour (3600s)
      const account = createMockAccount(3600);
      service.createUserFromMsalAccount(account);

      expect(service.isLoggedIn).toBeTrue();
      // expiryTime should match the 24h refresh token, NOT the 1h ID token
      expect(service.expiryTime?.toEpochSecond()).toBe(rtFutureSeconds);
    });

    it('should default to 24h refresh token expiry if no refresh token is in cache yet', () => {
      const account = createMockAccount(3600); // 1h ID token
      service.createUserFromMsalAccount(account);

      expect(service.isLoggedIn).toBeTrue();
      const secondsUntilExpiry = service.expiryTime!.toEpochSecond() - Math.floor(Date.now() / 1000);
      // Should be approximately 24h (86400s), not 1h (3600s)
      expect(secondsUntilExpiry).toBeGreaterThan(80000);
    });
  });

  describe('isIdTokenExpiring', () => {
    it('should return false if ID token is valid for > 5 minutes', () => {
      const account = createMockAccount(600); // 10 minutes remaining
      expect(service.isIdTokenExpiring(account)).toBeFalse();
    });

    it('should return true if ID token expires within 5 minutes', () => {
      const account = createMockAccount(200); // ~3.3 minutes remaining (< 300s)
      expect(service.isIdTokenExpiring(account)).toBeTrue();
    });

    it('should return true if ID token is already expired', () => {
      const account = createMockAccount(-10); // Expired 10 seconds ago
      expect(service.isIdTokenExpiring(account)).toBeTrue();
    });
  });

  describe('getBearerToken', () => {
    it('should return cached ID token directly without network call when not expiring', (done) => {
      const account = createMockAccount(1800); // 30 minutes left
      mockMsalService.instance.getActiveAccount.and.returnValue(account);

      service.getBearerToken().subscribe((token) => {
        expect(token).toBe('initial-id-token');
        expect(mockMsalService.instance.acquireTokenSilent).not.toHaveBeenCalled();
        done();
      });
    });

    it('should transparently use Refresh Token to acquire new ID token when ID token is expiring', (done) => {
      const expiringAccount = createMockAccount(100); // < 5 minutes left
      mockMsalService.instance.getActiveAccount.and.returnValue(expiringAccount);

      const refreshedAccount = createMockAccount(3600);
      refreshedAccount.idToken = 'newly-refreshed-id-token';

      const mockResult: AuthenticationResult = {
        authority: 'https://login.microsoftonline.com/test-tenant',
        uniqueId: 'uid-123',
        tenantId: 'tenant-123',
        scopes: ['openid', 'profile'],
        account: refreshedAccount,
        idToken: 'newly-refreshed-id-token',
        idTokenClaims: refreshedAccount.idTokenClaims as any,
        accessToken: 'new-access-token',
        fromCache: false,
        expiresOn: new Date(),
        correlationId: 'corr-123',
        tokenType: 'Bearer',
      };

      mockMsalService.instance.acquireTokenSilent.and.returnValue(Promise.resolve(mockResult));

      service.getBearerToken().subscribe((token) => {
        expect(token).toBe('newly-refreshed-id-token');
        expect(mockMsalService.instance.acquireTokenSilent).toHaveBeenCalledWith(
          jasmine.objectContaining({
            scopes: ['openid', 'profile'],
            account: expiringAccount,
            forceRefresh: true,
          })
        );
        expect(mockMsalService.instance.setActiveAccount).toHaveBeenCalledWith(refreshedAccount);
        expect(service.user$.getValue()?.getBearerToken()).toBe('newly-refreshed-id-token');
        done();
      });
    });

    it('should deduplicate concurrent getBearerToken requests into a single silent refresh', (done) => {
      const expiringAccount = createMockAccount(60);
      mockMsalService.instance.getActiveAccount.and.returnValue(expiringAccount);

      const refreshedAccount = createMockAccount(3600);
      refreshedAccount.idToken = 'deduped-refreshed-token';

      const mockResult: AuthenticationResult = {
        authority: 'https://login.microsoftonline.com/test-tenant',
        uniqueId: 'uid-123',
        tenantId: 'tenant-123',
        scopes: ['openid', 'profile'],
        account: refreshedAccount,
        idToken: 'deduped-refreshed-token',
        idTokenClaims: refreshedAccount.idTokenClaims as any,
        accessToken: 'new-access-token',
        fromCache: false,
        expiresOn: new Date(),
        correlationId: 'corr-123',
        tokenType: 'Bearer',
      };

      let resolvePromise: (value: any) => void;
      const delayedPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockMsalService.instance.acquireTokenSilent.and.returnValue(delayedPromise);

      let call1Result: string | null = null;
      let call2Result: string | null = null;

      service.getBearerToken().subscribe((token) => {
        call1Result = token;
      });

      service.getBearerToken().subscribe((token) => {
        call2Result = token;
      });

      // Should have only triggered acquireTokenSilent once
      expect(mockMsalService.instance.acquireTokenSilent.calls.count()).toBe(1);

      resolvePromise!(mockResult);

      setTimeout(() => {
        expect(call1Result).toBe('deduped-refreshed-token');
        expect(call2Result).toBe('deduped-refreshed-token');
        done();
      }, 50);
    });
  });

  describe('sessionTimeout', () => {
    it('should logout and navigate to session-timeout', () => {
      service.sessionTimeout();

      expect(mockMsalService.instance.setActiveAccount).toHaveBeenCalledWith(null);
      expect(service.isLoggedIn).toBeFalse();
      expect(service.user$.getValue()).toBeNull();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['session-timeout']);
    });
  });
});
