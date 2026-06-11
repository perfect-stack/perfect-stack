import { BehaviorSubject } from 'rxjs';
import { User } from './user/user';
import { ZonedDateTime } from '@js-joda/core';

export interface AuthenticationServiceProvider {
  isLoggedIn: boolean | null;
  user$: BehaviorSubject<User|null>;
  notifyUser$: BehaviorSubject<User|null>;
  redirectUrl: string | null;
  expiryTime: ZonedDateTime | null;

  login(): void;
  logout(): void;
  sessionTimeout(): void;
  createUser(idToken: string | null, accessToken: string | null, sendNotification: boolean): void;
  createUserFromLocalStorage(): void;
  navigateToFirstPage(): void;
}
