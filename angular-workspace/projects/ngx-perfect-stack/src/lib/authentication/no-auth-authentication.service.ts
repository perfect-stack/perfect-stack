import { Injectable } from '@angular/core';
import { AuthenticationServiceProvider } from './authentication-service-provider';
import { BehaviorSubject } from 'rxjs';
import { User } from './user/user';
import { NoAuthUser } from './user/no-auth-user';
import { ZonedDateTime, ZoneId } from '@js-joda/core';

@Injectable({
  providedIn: 'root',
})
export class NoAuthAuthenticationService implements AuthenticationServiceProvider {
  isLoggedIn: boolean | null = true;
  user$ = new BehaviorSubject<User | null>(new NoAuthUser());
  notifyUser$ = new BehaviorSubject<User | null>(new NoAuthUser());
  expiryTime: ZonedDateTime | null = ZonedDateTime.now(ZoneId.UTC).plusYears(10);
  redirectUrl: string | null = null;

  createUserFromLocalStorage(): void {}
  createUser(): void {}
  login(): void {}
  logout(): void {}
  sessionTimeout(): void {}
  navigateToFirstPage(): void {}
}
