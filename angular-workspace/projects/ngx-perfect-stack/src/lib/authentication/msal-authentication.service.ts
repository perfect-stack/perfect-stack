import {Inject, Injectable, OnDestroy} from '@angular/core';
import {Router} from '@angular/router';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../ngx-perfect-stack-config';
import {User} from './user/user';
import {MsalUser} from './user/msal-user';
import {BehaviorSubject, Subject} from 'rxjs';
import {nativeJs, ZonedDateTime, ZoneId} from '@js-joda/core';
import {MsalBroadcastService, MsalService} from "@azure/msal-angular";
import {AccountInfo, EventMessage, EventType, InteractionStatus} from "@azure/msal-browser";
import {filter, takeUntil} from "rxjs/operators";
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

  constructor(protected readonly router: Router,
              protected readonly msalService: MsalService,
              private msalBroadcastService: MsalBroadcastService,
              @Inject(STACK_CONFIG) protected readonly stackConfig: NgxPerfectStackConfig) {

    this._redirectUrl = localStorage.getItem('redirectUrl');

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
        this.checkAndSetActiveAccount();
      });
  }

  ngOnDestroy(): void {
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }

  checkAndSetActiveAccount(): void {
    let activeAccount = this.msalService.instance.getActiveAccount();

    if (!activeAccount && this.msalService.instance.getAllAccounts().length > 0) {
      activeAccount = this.msalService.instance.getAllAccounts()[0];
      this.msalService.instance.setActiveAccount(activeAccount);
    }

    this.isLoggedIn = !!activeAccount;
    if (this.isLoggedIn && activeAccount) {
      console.log('User is logged in via MSAL');
      this.createUserFromMsalAccount(activeAccount);
      this.navigateToFirstPage();
    } else {
      console.log('User is not logged in via MSAL');
      this.user$.next(null);
    }
  }

  createUserFromMsalAccount(account: AccountInfo) {
    let user = null;
    if (account && account.idTokenClaims) {
      const idTokenClaims = account.idTokenClaims as any;
      const expiryTime = ZonedDateTime.from(nativeJs(new Date(idTokenClaims.exp * 1000)));

      if (expiryTime.isAfter(ZonedDateTime.now(ZoneId.UTC))) {
        user = new MsalUser(account, this.stackConfig);
        this.expiryTime = expiryTime;
        console.log(`Create user from MSAL: session is active.`);
      } else {
        this.expiryTime = null;
        console.log(`Create user from MSAL: session is expired.`);
      }
    }
    this.user$.next(user);
    this.notifyUser$.next(user);
  }

  login(): void {
    console.log('Msal Login started: ');
    this.msalService.loginRedirect();
  }

  logout() {
    console.log('MSAL Logout: started');
    this.msalService.logoutRedirect({ postLogoutRedirectUri: '/' });
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
  }

  // The following methods are part of the interface but not used by MSAL since it has a different flow
  createUser(idToken: string | null, accessToken: string | null, sendNotification: boolean): void {
    // MSAL flow is different, see checkAndSetActiveAccount
  }

  createUserFromLocalStorage(): void {
    // MSAL flow is different, see checkAndSetActiveAccount
  }
}
