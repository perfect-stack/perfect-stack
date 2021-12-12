import { Injectable } from '@angular/core';
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup
} from 'firebase/auth';
import {Router} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  isLoggedIn = false;

  // store the URL so we can redirect after logging in
  redirectUrl: string | null = null;

  constructor(protected readonly router: Router) {
    onAuthStateChanged(getAuth(), (user) => {
      if (user) {
        console.log(`AuthenticationService: user "${user.displayName}" is signed IN`);
        this.isLoggedIn = true;
        this.navigateToFirstPage();
      } else {
        console.log('AuthenticationService: user is signed OUT');
        this.isLoggedIn = false;
      }
    });
  }

  login() {
    const auth = getAuth();
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        // Existing and future Auth states are now persisted in the current
        // session only. Closing the window would clear any existing state even
        // if a user forgets to sign out.
        // ...
        // New sign-in will be persisted with session persistence.
        return this.signInWithGoogle();
      })
      .catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(`Login failed: ${errorCode} - ${errorMessage}`);
      });
  }

  signInWithGoogle() {
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
          console.log(`User = ${JSON.stringify(user.toJSON())}`);

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

  navigateToFirstPage() {
    if(this.redirectUrl) {
      this.router.navigateByUrl(this.redirectUrl);
      this.redirectUrl = null;
    }
    else {
      this.router.navigate(['/data/Person/search']);
    }
  }


  logout() {
    console.log('logout()');
    const auth = getAuth();
    auth.signOut().then(() => {
      this.router.navigate(['/']);
      console.log('Sign out completed');
    });
  }
}
