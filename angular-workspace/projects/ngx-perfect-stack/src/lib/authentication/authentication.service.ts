import {Inject, Injectable} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../ngx-perfect-stack-config';
import {User} from './user/user';
import {CognitoUser} from './user/cognito-user';
import {BehaviorSubject} from 'rxjs';
import {nativeJs, ZonedDateTime, ZoneId} from '@js-joda/core';
import {jwtDecode} from "jwt-decode";

/**
 * Important: Don't make any HTTP calls from this class or anything else that it invokes, you will probably get an
 * error about circular references for HTTP_INTERCEPTORS at that point.
 *
 */
@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  isLoggedIn: boolean | null = null;

  user$ = new BehaviorSubject<User|null>(null);
  notifyUser$ = new BehaviorSubject<User|null>(null);

  expiryTime: ZonedDateTime | null = null;

  // store the URL so we can redirect after logging in
  private _redirectUrl: string | null = null;

  constructor(protected readonly router: Router,
              protected readonly route: ActivatedRoute,
              @Inject(STACK_CONFIG)
              protected readonly stackConfig: NgxPerfectStackConfig) {

    this._redirectUrl = localStorage.getItem('redirectUrl');
    this.createUserFromLocalStorage();
  }

  createUserFromLocalStorage() {
    const idToken = localStorage.getItem('idToken');
    const accessToken = localStorage.getItem('accessToken');
    if(idToken && accessToken) {
      this.createUser(idToken, accessToken, false);
    }
  }

  createUser(idToken: string | null, accessToken: string | null, sendNotification: boolean) {
    let user = null;
    if(idToken && accessToken) {
      const decodedToken: any = jwtDecode(idToken);
      const expiryTime = ZonedDateTime.from(nativeJs(new Date(decodedToken.exp * 1000)));
      if(expiryTime.isAfter(ZonedDateTime.now(ZoneId.UTC))) {
        user = new CognitoUser(this.stackConfig);
        user.idToken = idToken;
        user.accessToken = accessToken;
        user.saveTokens();

        this.expiryTime = expiryTime;
        this.navigateToFirstPage();

        this.isLoggedIn = true;
        console.log(`Create user: session is active.`);
      }
      else {
        this.isLoggedIn = false;
        console.log(`Create user: session is expired.`);
      }
    }
    else {
      this.isLoggedIn = false;
      console.log(`Create user: null tokens.`);
    }

    // "normal" user event
    this.user$.next(user);

    // "notify" user event, only used when login clicked
    if(sendNotification) {
      this.notifyUser$.next(user);
    }
  }

  get redirectUrl(): string | null {
    return this._redirectUrl;
  }

  set redirectUrl(value: string | null) {
    console.log(`set redirectUrl = ${value}`);
    if(value) {
      localStorage.setItem('redirectUrl', value);
    }
    else {
      localStorage.removeItem('redirectUrl');
    }
    this._redirectUrl = value;
  }

  login(): void {
    const url = this.stackConfig.cognitoLoginUrl;
    console.log('Login started: ');
    window.open(url, "_self");
  }

  navigateToFirstPage() {
    if(this._redirectUrl) {
      console.log(`navigateToFirstPage: by redirectUrl ${this._redirectUrl} `);
      this.router.navigateByUrl(this._redirectUrl);
      this.redirectUrl = null;
    }
    else {
      // There was some code in here about extracting the current location from the Window object, but it wasn't actually
      // needed. If we don't need to navigate to using the redirectUrl above then we just need to do nothing.
      console.log(`navigateToFirstPage:`, window.location);
    }
  }

  logout() {
    console.log('Logout: started');
    this.isLoggedIn = false;
    this.user$.getValue()?.logout();
    this.user$.next(null);
    this.router.navigate(['/']).then(() => {
      console.log('Logout: completed');
    });
  }

  sessionTimeout() {
    console.log('SessionTimeout: started');
    this.isLoggedIn = false;
    this.user$.getValue()?.logout();
    this.user$.next(null);
    this.router.navigate(['session-timeout']).then(() => {
      console.log('SessionTimout: completed');
    });
  }
}

