import {Observable} from 'rxjs';
import {LoginResultListener} from '../authentication.service';

export interface User {
  login(): void;
  logout(): Observable<void>;
  getName(): Observable<string>;
  getBearerToken(): Observable<string>;
  setLoginResultListener(listener: LoginResultListener): void;
}
