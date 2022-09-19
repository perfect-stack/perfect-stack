import {Inject, Injectable} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../ngx-perfect-stack-config';
import {User} from './user/user';
import {CognitoUser} from './user/cognito-user';
import {BehaviorSubject} from 'rxjs';
import {nativeJs, ZonedDateTime, ZoneId} from '@js-joda/core';
import jwt_decode from "jwt-decode";
import {HttpClient} from '@angular/common/http';
import {LoginNotification} from './login-notification';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  isLoggedIn: boolean | null = null;

  user$ = new BehaviorSubject<User|null>(null);

  expiryTime: ZonedDateTime | null = null;

  // store the URL so we can redirect after logging in
  private _redirectUrl: string | null = null;

  constructor(protected readonly router: Router,
              protected readonly route: ActivatedRoute,
              protected readonly http: HttpClient,
              @Inject(STACK_CONFIG)
              protected readonly stackConfig: NgxPerfectStackConfig) {

    this._redirectUrl = localStorage.getItem('redirectUrl');
    this.createUserFromLocalStorage();
  }

  createUserFromLocalStorage() {
    const idToken = localStorage.getItem('idToken');
    const accessToken = localStorage.getItem('accessToken');
    if(idToken && accessToken) {
      this.createUser(idToken, accessToken);
    }
  }

  createUser(idToken: string | null, accessToken: string | null) {
    let user = null;
    if(idToken && accessToken) {
      const decodedToken: any = jwt_decode(idToken);
      const expiryTime = ZonedDateTime.from(nativeJs(new Date(decodedToken.exp * 1000)));
      if(expiryTime.isAfter(ZonedDateTime.now(ZoneId.UTC))) {
        user = new CognitoUser(this.stackConfig);
        user.idToken = idToken;
        user.accessToken = accessToken;
        user.saveTokens();

        this.expiryTime = expiryTime;
        this.sendNotification(idToken, accessToken);
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

  sendNotification(idToken: string, accessToken: string) {
    console.log(`Sending login notification`);
    return this.http.post<LoginNotification>(`${this.stackConfig.apiUrl}/authentication/notification`, {
      idToken: idToken,
      accessToken: accessToken,
    });
  }

  findLastSignIn(username: string) {
    return this.http.get(`${this.stackConfig.apiUrl}/authentication/last-sign-in/${username}`);
  }

  navigateToFirstPage() {
    if(this._redirectUrl) {
      console.log(`navigateToFirstPage: by redirectUrl ${this._redirectUrl} `);
      this.router.navigateByUrl(this._redirectUrl);
      this.redirectUrl = null;
    }
    else {
      // TODO: needs to support query parameters once the app starts using them
      const currentUrl = new URL(window.location.href);
      console.log(`navigateToFirstPage: by currentUrl ${currentUrl} `);
      this.router.navigate([currentUrl.pathname]);
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

