import {Inject, Injectable} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../ngx-perfect-stack-config';
import {User} from './user/user';
import {FirebaseUser} from './user/firebase-user';
import {CognitoUser} from './user/cognito-user';
import {BehaviorSubject, of, switchMap} from 'rxjs';
import {nativeJs, ZonedDateTime} from '@js-joda/core';
import jwt_decode from "jwt-decode";
import {HttpClient} from '@angular/common/http';
import {LoginNotification} from './login-notification';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
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

  isLoggedIn = false;
  user: User;

  loginExpiry$ = new BehaviorSubject<string>('');
  expiryTime: ZonedDateTime | null = null;

  // store the URL so we can redirect after logging in
  private _redirectUrl: string | null = null;

  constructor(protected readonly router: Router,
              protected readonly route: ActivatedRoute,
              protected readonly http: HttpClient,
              @Inject(STACK_CONFIG)
              protected readonly stackConfig: NgxPerfectStackConfig) {

    this._redirectUrl = localStorage.getItem('redirectUrl');

    switch (this.stackConfig.authenticationProvider) {
      case 'FIREBASE':
        this.user = new FirebaseUser();
        break;
      case 'COGNITO':
        this.user = new CognitoUser(this.stackConfig);
        break;
      default:
        throw new Error(`Unknown authenticationProvider of ${this.stackConfig.authenticationProvider}`);
    }

    this.user.setLoginResultListener(this);
  }

  login() {
    if(this.user) {
      this.user.login();
    }
  }

  handleLoginResult(loginSuccessful: boolean): void {
    console.log(`handleLoginResult: loginSuccessful = ${loginSuccessful}`)
    if(loginSuccessful) {
      this.isLoggedIn = true;

      this.user.getBearerToken().pipe(switchMap(token => {
        const decodedToken: any = jwt_decode(token);
        this.expiryTime = ZonedDateTime.from(nativeJs(new Date(decodedToken.exp * 1000)));
        return of('')
      })).subscribe(() => {
        // This subscription might be needed, otherwise the code above won't be executed?
        console.log(`Expiry time has been set: ${this.expiryTime}`);
      });

      this.navigateToFirstPage();
    }
    else {
      this.isLoggedIn = false;
    }
  }

  sendNotification(idToken: string, accessToken: string) {
    console.log(`Sending login notification`);
    return this.http.post<LoginNotification>(`${this.stackConfig.apiUrl}/authentication/notification`, {
      idToken: idToken,
      accessToken: accessToken,
    });
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
    this.user.logout().subscribe(() => {
      this.router.navigate(['/']).then(() => {
        console.log('Logout: completed');
      });
    });
  }

  sessionTimeout() {
    console.log('SessionTimout: started');
    this.isLoggedIn = false;
    this.user.logout().subscribe(() => {
      this.router.navigate(['session-timeout']).then(() => {
        console.log('SessionTimout: completed');
      });
    });
  }
}


export interface LoginResultListener {
  handleLoginResult(loginSuccessful: boolean): void;
}
