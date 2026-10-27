import {Inject, Injectable, OnDestroy} from '@angular/core';
import {Router} from '@angular/router';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../ngx-perfect-stack-config';
import {User} from './user/user';
import {MsalUser} from './user/msal-user';
import {BehaviorSubject, from, Observable, of, Subject} from 'rxjs';
import {Duration, nativeJs, ZoneId, ZonedDateTime} from '@js-joda/core';
import {MsalBroadcastService, MsalService} from "@azure/msal-angular";
import {AccountInfo, AuthenticationResult, EventMessage, EventType, InteractionStatus, SilentRequest} from "@azure/msal-browser";
import {catchError, filter, finalize, map, shareReplay, takeUntil} from "rxjs/operators";
import {AuthenticationServiceProvider} from "./authentication-service-provider";

@Injectable({
  providedIn: 'root'
})
export class MsalAuthenticationService implements AuthenticationServiceProvider, OnDestroy {

  isLoggedIn: boolean | null = null;
  user$ = new BehaviorSubject<User|null>(null);
  notifyUser$ = new BehaviorSubject<User|null>(null);
  expiryTime: ZonedDateTime | null = null;
  private readonly _destroying$ = new Subject<void>();

  private _redirectUrl: string | null = null;
  private refreshInProgress$: Observable<string | null> | null = null;
  private tokenRefreshTimer: any = null;

  constructor(protected readonly router: Router,
              protected readonly msalService: MsalService,
              private msalBroadcastService: MsalBroadcastService,
              @Inject(STACK_CONFIG) protected readonly stackConfig: NgxPerfectStackConfig) {

    if (this.stackConfig && this.stackConfig.authenticationProvider === "MSAL") {
      this._redirectUrl = localStorage.getItem("redirectUrl");

      // This is essential for MSAL to process the redirect and finish initialization.
      this.msalService.handleRedirectObservable().subscribe();

      this.msalBroadcastService.inProgress$
        .pipe(
          filter((status: InteractionStatus) => status === InteractionStatus.None),
          takeUntil(this._destroying$)
        )
        .subscribe(() => {
          this.checkAndSetActiveAccount();
        });

      this.msalBroadcastService.msalSubject$
        .pipe(
          filter((msg: EventMessage) => msg.eventType === EventType.LOGIN_SUCCESS),
          takeUntil(this._destroying$)
        )
        .subscribe((result: EventMessage) => {
          const payload = result.payload as any;
          this.msalService.instance.setActiveAccount(payload.account);
          this.checkAndSetActiveAccount(true);
        });
    }
  }

  ngOnDestroy(): void {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }

  checkAndSetActiveAccount(sendNotification = false): void {
    let activeAccount = this.msalService.instance.getActiveAccount();

    if (!activeAccount && this.msalService.instance.getAllAccounts().length > 0) {
      activeAccount = this.msalService.instance.getAllAccounts()[0];
      this.msalService.instance.setActiveAccount(activeAccount);
    }

    this.isLoggedIn = !!activeAccount;
    if (this.isLoggedIn && activeAccount) {
      console.log('User is logged in via MSAL');
      this.createUserFromMsalAccount(activeAccount, sendNotification);
      this.navigateToFirstPage();
      // If the ID token is expiring or already expired, proactively refresh it
      if (this.isIdTokenExpiring(activeAccount)) {
        console.log('MSAL active account ID token is expiring or expired on check, proactively refreshing');
        this.getBearerToken().subscribe();
      }
    } else {
      console.log('User is not logged in via MSAL');
      this.user$.next(null);
    }
  }

  createUserFromMsalAccount(account: AccountInfo, sendNotification = false): void {
    let user = null;
    if (account && account.idTokenClaims) {
      const idTokenClaims = account.idTokenClaims as any;
      const rtExpiry = this.getRefreshTokenExpiry(account);
      const defaultRtExpiry = ZonedDateTime.now(ZoneId.UTC).plusHours(24);

      // Session timeout is tied to the Refresh token expiry (defaulting to 24h for SPA)
      this.expiryTime = rtExpiry || defaultRtExpiry;

      // Log user roles and groups from the ID Token claims
      console.log('MSAL User Roles:', idTokenClaims.roles || 'No roles assigned');
      console.log('MSAL User Groups:', idTokenClaims.groups || 'No groups assigned');

      if (this.expiryTime.isAfter(ZonedDateTime.now(ZoneId.UTC))) {
        user = new MsalUser(account, this.stackConfig);
        this.isLoggedIn = true;
        console.log(`Create user from MSAL: session is active. Refresh token expiry: ${this.expiryTime}`);

        // Schedule proactive refresh of ID token before the ID token expires
        this.scheduleProactiveTokenRefresh(idTokenClaims.exp);
      } else {
        this.expiryTime = null;
        this.isLoggedIn = false;
        console.log(`Create user from MSAL: session is expired.`);
      }
    }
    this.user$.next(user);
    if (sendNotification) {
      this.notifyUser$.next(user);
    }
  }

  private scheduleProactiveTokenRefresh(idTokenExpSeconds?: number): void {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }

    if (!idTokenExpSeconds) {
      return;
    }

    const idTokenExpMs = idTokenExpSeconds * 1000;
    // Schedule refresh 5 minutes (300,000 ms) before ID token expiry
    const refreshDelayMs = (idTokenExpMs - Date.now()) - (5 * 60 * 1000);

    if (refreshDelayMs > 0) {
      console.log(`Scheduling proactive MSAL ID token refresh in ${Math.round(refreshDelayMs / 1000)} seconds`);
      this.tokenRefreshTimer = setTimeout(() => {
        console.log('Proactive MSAL ID token refresh timer fired');
        this.getBearerToken().subscribe();
      }, refreshDelayMs);
    } else {
      // Token is already expiring or expired, refresh shortly
      this.tokenRefreshTimer = setTimeout(() => {
        this.getBearerToken().subscribe();
      }, 1000);
    }
  }

  getRefreshTokenExpiry(account?: AccountInfo | null): ZonedDateTime | null {
    const storages = [sessionStorage, localStorage];
    const targetAccountId = account?.homeAccountId;

    for (const storage of storages) {
      try {
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key && (key.includes('refreshtoken') || (key.startsWith('msal.') && key.includes(this.stackConfig.msalClientId)))) {
            const raw = storage.getItem(key);
            if (raw) {
              const item = JSON.parse(raw);
              if (item && item.credentialType === 'RefreshToken') {
                if (!targetAccountId || item.homeAccountId === targetAccountId) {
                  if (item.expiresOn) {
                    const expMs = parseInt(item.expiresOn, 10) * 1000;
                    return ZonedDateTime.from(nativeJs(new Date(expMs)));
                  } else if (item.lastUpdatedAt) {
                    // Default SPA refresh token lifetime is 24 hours (86,400,000 ms)
                    const lastUpdatedMs = parseInt(item.lastUpdatedAt, 10);
                    const expMs = lastUpdatedMs + (24 * 60 * 60 * 1000);
                    return ZonedDateTime.from(nativeJs(new Date(expMs)));
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        // Ignore storage access errors
      }
    }
    return null;
  }

  isIdTokenExpiring(account?: AccountInfo | null, bufferSeconds = 300): boolean {
    const acc = account || this.msalService.instance.getActiveAccount();
    if (!acc || !acc.idTokenClaims) {
      return true;
    }
    const exp = (acc.idTokenClaims as any).exp;
    if (!exp) {
      return true;
    }
    const nowSeconds = Math.floor(Date.now() / 1000);
    return (exp - nowSeconds) <= bufferSeconds;
  }

  isRefreshTokenExpiring(account?: AccountInfo | null, bufferSeconds = 30): boolean {
    const rtExpiry = this.getRefreshTokenExpiry(account);
    if (!rtExpiry) {
      return false;
    }
    const duration = Duration.between(ZonedDateTime.now(ZoneId.UTC), rtExpiry);
    return duration.seconds() <= bufferSeconds;
  }

  getBearerToken(): Observable<string | null> {
    const activeAccount = this.msalService.instance.getActiveAccount();
    if (!activeAccount) {
      return of(null);
    }

    // If ID token is valid and not expiring in next 5 minutes, return it immediately
    if (!this.isIdTokenExpiring(activeAccount)) {
      return of(activeAccount.idToken ?? null);
    }

    // If a refresh is already in-flight, reuse that observable
    if (this.refreshInProgress$) {
      return this.refreshInProgress$;
    }

    console.log('MSAL ID token expiring or expired. Silently acquiring fresh ID token using Refresh token...');

    const silentRequest: SilentRequest = {
      scopes: ['openid', 'profile'],
      account: activeAccount,
      forceRefresh: true
    };

    this.refreshInProgress$ = from(this.msalService.instance.acquireTokenSilent(silentRequest)).pipe(
      map((result: AuthenticationResult) => {
        console.log('MSAL ID token refreshed successfully');
        if (result && result.account) {
          this.msalService.instance.setActiveAccount(result.account);
          this.createUserFromMsalAccount(result.account, false);
        }
        return result.idToken;
      }),
      catchError((error) => {
        console.error('Failed to silently refresh MSAL ID token:', error);
        if (this.isRefreshTokenExpiring(activeAccount, 300)) {
          console.warn('MSAL refresh token is expiring or expired, triggering session timeout');
          this.sessionTimeout();
        }
        return of(null);
      }),
      finalize(() => {
        this.refreshInProgress$ = null;
      }),
      shareReplay(1)
    );

    return this.refreshInProgress$;
  }

  login(): void {
    console.log('Msal Login started: ');
    this.msalService.loginRedirect();
  }

  logout() {
    console.log('MSAL Logout: local logout only');
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
    this.refreshInProgress$ = null;
    this.msalService.instance.setActiveAccount(null);

    // Clear MSAL cache from both sessionStorage and localStorage
    this.clearMsalCache(sessionStorage);
    this.clearMsalCache(localStorage);

    this.user$.next(null);
    this.isLoggedIn = false;
    this.expiryTime = null;
    this.redirectUrl = null;
    this.router.navigate(['/']);
  }

  clearMsalCache(storage: Storage) {
    const msalKeys = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && (key.startsWith('msal.') || key.includes(this.stackConfig.msalClientId))) {
        msalKeys.push(key);
      }
    }

    msalKeys.forEach(key => storage.removeItem(key));
  }

  get redirectUrl(): string | null {
    return this._redirectUrl;
  }

  set redirectUrl(value: string | null) {
    if(value) {
      localStorage.setItem('redirectUrl', value);
    }
    else {
      localStorage.removeItem('redirectUrl');
    }
    this._redirectUrl = value;
  }

  navigateToFirstPage() {
    if(this._redirectUrl) {
      this.router.navigateByUrl(this._redirectUrl);
      this.redirectUrl = null;
    }
  }

  sessionTimeout() {
    this.logout();
    this.router.navigate(['session-timeout']);
  }

  // The following methods are part of the interface but not used by MSAL since it has a different flow
  createUser(idToken: string | null, accessToken: string | null, sendNotification: boolean): void {
    // MSAL flow is different, see checkAndSetActiveAccount
  }

  createUserFromLocalStorage(): void {
    // MSAL flow is different, see checkAndSetActiveAccount
  }
}
