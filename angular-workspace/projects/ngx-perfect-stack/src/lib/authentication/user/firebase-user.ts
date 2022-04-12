import {User} from './user';
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup
} from 'firebase/auth';
import {from, Observable} from 'rxjs';
import {LoginResultListener} from '../authentication.service';

export class FirebaseUser implements User {

  loginResultListener: LoginResultListener;

  constructor() {
    // This is a Firebase way of initializing the User
    onAuthStateChanged(getAuth(), (user) => {
      if (user) {
        console.log(`AuthenticationService: user "${user.displayName}" is signed IN`);
        this.loginResultListener.handleLoginResult(true);
      } else {
        console.log('AuthenticationService: user is signed OUT');
        this.loginResultListener.handleLoginResult(false);
      }
    });

    const auth = getAuth();
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        // New sign-in will be persisted with session persistence.
        console.log('browserLocalPersistence has been set');
      })
      .catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(`Login failed: ${errorCode} - ${errorMessage}`);
      });
  }

  login(): void {
    const provider = new GoogleAuthProvider();
    const auth = getAuth();
    signInWithPopup(auth, provider)
      .then((result) => {
        // This gives you a Google Access Token. You can use it to access the Google API.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if(credential) {
          //const accessToken = credential.accessToken;
          //const idToken = credential.idToken;

          // The signed-in user info.
          const user = result.user;
          //console.log(`Login successful: ${JSON.stringify(credential.toJSON())}`);
          //console.log(`User = ${JSON.stringify(user.toJSON())}`);

          // don't do this here, let the authState change listener (above) do it instead
          //this.navigateToFirstPage();
        }
      }).catch((error) => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log(`Login failed: ${errorCode} - ${errorMessage}`);
    });
  }

  logout() {
    const auth = getAuth();
    return from(auth.signOut());
  }

  getBearerToken(): Observable<string> {
    const auth = getAuth();
    if(auth.currentUser) {
      return from(auth.currentUser.getIdToken());
    }
    else {
      return from('');
    }
  }

  getName(): Observable<string> {
    return from('');
  }

  setLoginResultListener(listener: LoginResultListener): void {
    this.loginResultListener = listener;
  }
}
