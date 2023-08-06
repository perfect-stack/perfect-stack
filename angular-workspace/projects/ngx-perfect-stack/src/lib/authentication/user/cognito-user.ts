import {User} from './user';
import {NgxPerfectStackConfig} from '../../ngx-perfect-stack-config';
import jwt_decode from 'jwt-decode';

export class CognitoUser  implements User {

  private _idToken: string | null;
  private _accessToken: string | null;

  // calculated once when we get a new token
  groups: string[] = [];

  constructor(protected readonly stackConfig: NgxPerfectStackConfig) {
  }

  get idToken(): string | null {
    return this._idToken;
  }

  set idToken(value: string | null) {
    this._idToken = value;
    if(this._idToken) {
      const decodedToken: any = jwt_decode(this._idToken);
      this.groups = [ ...decodedToken['cognito:groups'], ...this.convertToArray(decodedToken['custom:group']) ];
    }
    else {
      this.groups = [];
    }
  }

  convertToArray(input: string | null | string[]): string[] {
    if (input === null) {
      return []; // Return an empty array when the input is null.
    } else if (Array.isArray(input)) {
      return input; // Return the input array as it is when it's already an array.
    } else {
      return [input]; // Wrap the input string in an array when it's a single string.
    }
  }

  get accessToken(): string | null {
    return this._accessToken;
  }

  set accessToken(value: string | null) {
    this._accessToken = value;
  }

  saveTokens() {
    if(this._idToken && this._accessToken) {
      localStorage.setItem('idToken', this._idToken);
      localStorage.setItem('accessToken', this._accessToken);
    }
  }

  clearTokens() {
    localStorage.removeItem('idToken');
    localStorage.removeItem('accessToken');
  }

  logout(): void {
    this.clearTokens();
  }

  getBearerToken(): string|null {
    return this._idToken;
  }

  getGroups(): string[] {
    return this.groups;
  }

}
