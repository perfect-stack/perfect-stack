import {Inject, Injectable} from '@angular/core';
import { getAuth } from 'firebase/auth';
import {ActivatedRoute, Router} from '@angular/router';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../ngx-perfect-stack-config';
import {User} from './user/user';
import {FirebaseUser} from './user/firebase-user';
import {CognitoUser} from './user/cognito-user';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  get redirectUrl(): string | null {
    return this._redirectUrl;
  }

  set redirectUrl(value: string | null) {
    console.log(`set redirectUrl = ${value}`);
    this._redirectUrl = value;
  }

  isLoggedIn = false;
  user: User;

  // store the URL so we can redirect after logging in
  private _redirectUrl: string | null = null;

  constructor(protected readonly router: Router,
              protected readonly route: ActivatedRoute,
              @Inject(STACK_CONFIG)
              protected readonly stackConfig: NgxPerfectStackConfig) {

    switch (this.stackConfig.authenticationProvider) {
      case 'FIREBASE':
        this.user = new FirebaseUser();
        break;
      case 'COGNITO':
        this.user = new CognitoUser();
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
    if(loginSuccessful) {
      this.isLoggedIn = true;
      this.navigateToFirstPage();
    }
    else {
      this.isLoggedIn = false;
    }
  }

  navigateToFirstPage() {
    if(this._redirectUrl) {
      console.log(`navigateToFirstPage: by redirectUrl ${this._redirectUrl} `);
      this.router.navigateByUrl(this._redirectUrl);
      this._redirectUrl = null;
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
    })
  }
}


export interface LoginResultListener {
  handleLoginResult(loginSuccessful: boolean): void;
}
