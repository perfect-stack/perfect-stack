import {Inject, Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../ngx-perfect-stack-config';
import {User} from './user/user';
import {CognitoUser} from './user/cognito-user';
import {BehaviorSubject} from 'rxjs';
import {nativeJs, ZonedDateTime, ZoneId} from '@js-joda/core';
import {jwtDecode} from "jwt-decode";
import {AuthenticationServiceProvider} from './authentication-service-provider';

@Injectable({
  providedIn: 'root'
})
export class CognitoAuthenticationService implements AuthenticationServiceProvider {

  isLoggedIn: boolean | null = null;
  user$ = new BehaviorSubject<User|null>(null);
  notifyUser$ = new BehaviorSubject<User|null>(null);
  expiryTime: ZonedDateTime | null = null;

  private _redirectUrl: string | null = null;

  constructor(
    protected readonly router: Router,
    @Inject(STACK_CONFIG) protected readonly stackConfig: NgxPerfectStackConfig
  ) {
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

    this.user$.next(user);

    if(sendNotification) {
      this.notifyUser$.next(user);
    }
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

  login(): void {
    const url = this.stackConfig.cognitoLoginUrl;
    window.open(url, "_self");
  }

  navigateToFirstPage() {
    if(this._redirectUrl) {
      this.router.navigateByUrl(this._redirectUrl);
      this.redirectUrl = null;
    }
  }

  logout() {
    this.isLoggedIn = false;
    this.user$.getValue()?.logout();
    this.user$.next(null);
    this.router.navigate(['/']);
  }

  sessionTimeout() {
    this.isLoggedIn = false;
    this.user$.getValue()?.logout();
    this.user$.next(null);
    this.router.navigate(['session-timeout']);
  }
}
