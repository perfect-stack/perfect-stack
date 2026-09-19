import {Inject, Injectable} from '@angular/core';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../ngx-perfect-stack-config';
import {User} from './user/user';
import {BehaviorSubject} from 'rxjs';
import {MsalAuthenticationService} from "./msal-authentication.service";
import {CognitoAuthenticationService} from "./cognito-authentication.service";
import {NoAuthAuthenticationService} from "./no-auth-authentication.service";
import {AuthenticationServiceProvider} from "./authentication-service-provider";
import {ZonedDateTime} from "@js-joda/core";

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  private provider: AuthenticationServiceProvider;

  constructor(
    private cognitoAuthService: CognitoAuthenticationService,
    private msalAuthService: MsalAuthenticationService,
    private noAuthService: NoAuthAuthenticationService,
    @Inject(STACK_CONFIG) private readonly stackConfig: NgxPerfectStackConfig
  ) {
    if (this.stackConfig.authenticationProvider === 'MSAL') {
      this.provider = this.msalAuthService;
      console.log('AuthenticationService initialized with MSAL provider');
    } else if (this.stackConfig.authenticationProvider === 'None' || this.stackConfig.authenticationProvider === 'NONE') {
      this.provider = this.noAuthService;
      console.log('AuthenticationService initialized with NoAuth provider');
    } else {
      this.provider = this.cognitoAuthService;
      console.log('AuthenticationService initialized with Cognito provider');
    }
  }

  get isLoggedIn(): boolean | null {
    return this.provider.isLoggedIn;
  }

  get user$(): BehaviorSubject<User|null> {
    return this.provider.user$;
  }

  get notifyUser$(): BehaviorSubject<User|null> {
    return this.provider.notifyUser$;
  }

  get redirectUrl(): string | null {
    return this.provider.redirectUrl;
  }

  set redirectUrl(value: string | null) {
    this.provider.redirectUrl = value;
  }

  get expiryTime(): ZonedDateTime | null {
    return this.provider.expiryTime;
  }

  login(): void {
    this.provider.login();
  }

  logout(): void {
    this.provider.logout();
  }

  sessionTimeout(): void {
    this.provider.sessionTimeout();
  }

  createUserFromLocalStorage() {
    this.provider.createUserFromLocalStorage();
  }

  createUser(idToken: string | null, accessToken: string | null, sendNotification: boolean) {
    this.provider.createUser(idToken, accessToken, sendNotification);
  }

  navigateToFirstPage() {
    this.provider.navigateToFirstPage();
  }
}
