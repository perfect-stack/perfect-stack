import {Injectable} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/compat/auth';
import {BehaviorSubject} from 'rxjs';
import {User} from 'firebase';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {

  user$: BehaviorSubject<User> = new BehaviorSubject<User>(null);
  idToken$: BehaviorSubject<string> = new BehaviorSubject<string>('');

  constructor(
    public readonly fireauth: AngularFireAuth,
  ) {
    fireauth.user.subscribe(this.user$);
    fireauth.idToken.subscribe(this.idToken$);
  }
}
