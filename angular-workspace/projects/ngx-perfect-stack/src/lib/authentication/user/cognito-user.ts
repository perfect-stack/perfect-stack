import {User} from './user';
import {Observable, of} from 'rxjs';
import {LoginResultListener} from '../authentication.service';
import {NgxPerfectStackConfig, STACK_CONFIG} from '../../ngx-perfect-stack-config';

export class CognitoUser  implements User {

  loginResultListener: LoginResultListener;

  idToken: string | null;
  accessToken: string | null;

  constructor(protected readonly stackConfig: NgxPerfectStackConfig) {
    this.loadTokens();
  }

  loadTokens() {
    this.idToken = localStorage.getItem('idToken');
    this.accessToken = localStorage.getItem('accessToken');
  }

  saveTokens() {
    if(this.idToken && this.accessToken) {
      localStorage.setItem('idToken', this.idToken);
      localStorage.setItem('accessToken', this.accessToken);
    }
  }

  clearTokens() {
    localStorage.removeItem('idToken');
    localStorage.removeItem('accessToken');
  }

  login(): void {
    const url = this.stackConfig.cognitoLoginUrl;
    window.open(url, "_self");
  }

  logout(): Observable<void> {
    this.clearTokens();
    // Ok so this is a crazy bit of JS, just needed to fulfill the interface contract. Need to Google for an explanation of it.
    return of(void 0);
  }

  getBearerToken(): Observable<string> {
    if(this.idToken) {
      return of(this.idToken);
    }
    else {
      throw new Error('No Bearer token is available');
    }
  }

  getName(): Observable<string> {
    return of('Name GoesHere');
  }

  setLoginResultListener(listener: LoginResultListener): void {
    this.loginResultListener = listener;

    // TODO: this isn't correct should check expiry first
    if(this.idToken && this.accessToken) {
      this.loginResultListener.handleLoginResult(true);
    }
  }
}
